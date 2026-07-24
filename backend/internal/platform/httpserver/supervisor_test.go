package httpserver

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestSupervisorTreatsPublicFailureAsFatal(t *testing.T) {
	privateStopped := make(chan struct{})
	var stopPrivate sync.Once
	supervisor := NewSupervisor([]ManagedServer{
		{Name: "public", Required: true, Serve: func() error { return errors.New("bind failed") }, Shutdown: func(context.Context) error { return nil }},
		{Name: "private", Serve: func() error { <-privateStopped; return http.ErrServerClosed }, Shutdown: func(context.Context) error { stopPrivate.Do(func() { close(privateStopped) }); return nil }},
	}, 50*time.Millisecond, nil)

	err := supervisor.Run(context.Background())
	if err == nil || !errors.Is(err, ErrRequiredServerStopped) {
		t.Fatalf("expected fatal public error, got %v", err)
	}
}

func TestSupervisorKeepsPublicAliveWhenPrivateFails(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	publicStopped := make(chan struct{})
	var stopPublic sync.Once
	reported := make(chan ServerReport, 4)
	supervisor := NewSupervisor([]ManagedServer{
		{Name: "public", Required: true, Serve: func() error { <-publicStopped; return http.ErrServerClosed }, Shutdown: func(context.Context) error { stopPublic.Do(func() { close(publicStopped) }); return nil }},
		{Name: "private", Serve: func() error { return errors.New("private bind failed") }, Shutdown: func(context.Context) error { return nil }},
	}, 50*time.Millisecond, func(report ServerReport) { reported <- report })

	done := make(chan error, 1)
	go func() { done <- supervisor.Run(ctx) }()
	for {
		report := <-reported
		if report.Name == "private" && report.State == ListenerUnavailable {
			cancel()
			break
		}
	}
	if err := <-done; err != nil {
		t.Fatalf("private failure must remain non-fatal: %v", err)
	}
}

func TestSupervisorRecoversServePanicAndBoundsShutdown(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	publicStopped := make(chan struct{})
	var stopPublic sync.Once
	privateUnavailable := make(chan ServerReport, 1)
	shutdownHadDeadline := false
	supervisor := NewSupervisor([]ManagedServer{
		{Name: "public", Required: true, Serve: func() error { <-publicStopped; return http.ErrServerClosed }, Shutdown: func(ctx context.Context) error {
			_, shutdownHadDeadline = ctx.Deadline()
			stopPublic.Do(func() { close(publicStopped) })
			return nil
		}},
		{Name: "private", Serve: func() error { panic("sensitive panic sentinel") }, Shutdown: func(context.Context) error { return nil }},
	}, 50*time.Millisecond, func(report ServerReport) {
		if report.Name == "private" && report.State == ListenerUnavailable {
			privateUnavailable <- report
		}
	})

	done := make(chan error, 1)
	go func() { done <- supervisor.Run(ctx) }()
	report := <-privateUnavailable
	if report.Reason != "panic_recovered" || report.ErrorKind != "panic" || report.Context != "listener_serve" || report.StackHash == "" {
		t.Fatalf("panic report must contain sanitized task context: %#v", report)
	}
	if strings.Contains(fmt.Sprintf("%#v", report), "sensitive panic sentinel") {
		t.Fatalf("panic report leaked panic text: %#v", report)
	}
	cancel()
	if err := <-done; err != nil {
		t.Fatalf("private panic must be recovered and non-fatal: %v", err)
	}
	if !shutdownHadDeadline {
		t.Fatal("shutdown must use a bounded context")
	}
}

func TestSupervisorKeepsOrdinaryServeErrorDistinctFromPanic(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	reports := make(chan ServerReport, 4)
	supervisor := NewSupervisor([]ManagedServer{
		{Name: "public", Required: true, Serve: func() error { <-ctx.Done(); return http.ErrServerClosed }, Shutdown: func(context.Context) error { return nil }},
		{Name: "private", Serve: func() error { return errors.New("private bind failed sentinel") }, Shutdown: func(context.Context) error { return nil }},
	}, 50*time.Millisecond, func(report ServerReport) { reports <- report })

	done := make(chan error, 1)
	go func() { done <- supervisor.Run(ctx) }()
	for {
		report := <-reports
		if report.Name == "private" && report.State == ListenerUnavailable {
			if report.Reason != "serve_failed" || report.ErrorKind != "serve_error" || report.StackHash != "" {
				t.Fatalf("ordinary serve error was misclassified: %#v", report)
			}
			cancel()
			break
		}
	}
	if err := <-done; err != nil {
		t.Fatalf("private error must be non-fatal: %v", err)
	}
}
