package httpserver

import (
	"context"
	"errors"
	"net/http"
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
	privateUnavailable := make(chan struct{}, 1)
	shutdownHadDeadline := false
	supervisor := NewSupervisor([]ManagedServer{
		{Name: "public", Required: true, Serve: func() error { <-publicStopped; return http.ErrServerClosed }, Shutdown: func(ctx context.Context) error {
			_, shutdownHadDeadline = ctx.Deadline()
			stopPublic.Do(func() { close(publicStopped) })
			return nil
		}},
		{Name: "private", Serve: func() error { panic("sensitive panic") }, Shutdown: func(context.Context) error { return nil }},
	}, 50*time.Millisecond, func(report ServerReport) {
		if report.Name == "private" && report.State == ListenerUnavailable {
			privateUnavailable <- struct{}{}
		}
	})

	done := make(chan error, 1)
	go func() { done <- supervisor.Run(ctx) }()
	<-privateUnavailable
	cancel()
	if err := <-done; err != nil {
		t.Fatalf("private panic must be recovered and non-fatal: %v", err)
	}
	if !shutdownHadDeadline {
		t.Fatal("shutdown must use a bounded context")
	}
}
