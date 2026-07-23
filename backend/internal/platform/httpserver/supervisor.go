package httpserver

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"runtime/debug"
	"time"
)

var (
	ErrRequiredServerStopped = errors.New("required server stopped")
	ErrServerPanicked        = errors.New("server goroutine panicked")
)

type ListenerState string

const (
	ListenerStarting    ListenerState = "starting"
	ListenerAvailable   ListenerState = "available"
	ListenerUnavailable ListenerState = "unavailable"
	ListenerStopped     ListenerState = "stopped"
)

type ServerReport struct {
	Name      string
	State     ListenerState
	Reason    string
	ErrorKind string
	Context   string
	StackHash string
}

type ManagedServer struct {
	Name     string
	Required bool
	Serve    func() error
	Shutdown func(context.Context) error
}

type serverExit struct {
	server    ManagedServer
	err       error
	errorKind string
	stackHash string
}

type Supervisor struct {
	servers         []ManagedServer
	shutdownTimeout time.Duration
	report          func(ServerReport)
}

func NewSupervisor(servers []ManagedServer, shutdownTimeout time.Duration, report func(ServerReport)) *Supervisor {
	if report == nil {
		report = func(ServerReport) {}
	}
	return &Supervisor{servers: servers, shutdownTimeout: shutdownTimeout, report: report}
}

func (supervisor *Supervisor) Run(ctx context.Context) error {
	exits := make(chan serverExit, len(supervisor.servers))
	for _, server := range supervisor.servers {
		supervisor.report(ServerReport{Name: server.Name, State: ListenerStarting})
		go safeServe(server, exits)
		supervisor.report(ServerReport{Name: server.Name, State: ListenerAvailable})
	}

	for {
		select {
		case <-ctx.Done():
			supervisor.shutdownAll()
			return nil
		case result := <-exits:
			if result.err == nil || errors.Is(result.err, http.ErrServerClosed) {
				supervisor.report(ServerReport{Name: result.server.Name, State: ListenerStopped})
				if !result.server.Required {
					continue
				}
			} else {
				reason, errorKind := "serve_failed", "serve_error"
				if result.errorKind == "panic" || errors.Is(result.err, ErrServerPanicked) {
					reason, errorKind = "panic_recovered", "panic"
				}
				supervisor.report(ServerReport{Name: result.server.Name, State: ListenerUnavailable, Reason: reason, ErrorKind: errorKind, Context: "listener_serve", StackHash: result.stackHash})
				if !result.server.Required {
					continue
				}
			}
			supervisor.shutdownAll()
			return fmt.Errorf("%w: %s", ErrRequiredServerStopped, result.server.Name)
		}
	}
}

func safeServe(server ManagedServer, exits chan<- serverExit) {
	result := serverExit{server: server, errorKind: "serve_error"}
	defer func() {
		if recover() != nil {
			result.err = ErrServerPanicked
			result.errorKind = "panic"
			stackDigest := sha256.Sum256(debug.Stack())
			result.stackHash = hex.EncodeToString(stackDigest[:8])
		}
		exits <- result
	}()
	if server.Serve == nil {
		result.err = errors.New("missing serve function")
		return
	}
	result.err = server.Serve()
}

func (supervisor *Supervisor) shutdownAll() {
	ctx, cancel := context.WithTimeout(context.Background(), supervisor.shutdownTimeout)
	defer cancel()
	for _, server := range supervisor.servers {
		if server.Shutdown != nil {
			_ = server.Shutdown(ctx)
		}
		supervisor.report(ServerReport{Name: server.Name, State: ListenerStopped})
	}
}
