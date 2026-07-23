package application

import (
	"sync/atomic"
	"time"
)

type DatabaseState string

const (
	DatabaseAvailable   DatabaseState = "available"
	DatabaseDegraded    DatabaseState = "degraded"
	DatabaseUnavailable DatabaseState = "unavailable"
)

type HealthReason string

const (
	ReasonNone                 HealthReason = ""
	ReasonInvalidWriteTimeout  HealthReason = "invalid_write_timeout"
	ReasonWriteTimeout         HealthReason = "write_timeout"
	ReasonWriteFailed          HealthReason = "write_failed"
	ReasonOpenFailed           HealthReason = "open_failed"
	ReasonMigrationFailed      HealthReason = "migration_failed"
	ReasonRuntimeUnsupported   HealthReason = "runtime_unsupported"
	ReasonInvalidVisitorSecret HealthReason = "invalid_visitor_secret"
)

type healthState struct {
	DatabaseState DatabaseState
	Reason        HealthReason
}

type RuntimeHealth struct {
	processStartedAt      time.Time
	lastSuccessfulWriteMS atomic.Int64
	droppedSinceStart     atomic.Uint64
	state                 atomic.Value
}

type RuntimeHealthSnapshot struct {
	DatabaseState         DatabaseState
	Reason                HealthReason
	LastSuccessfulWriteAt *time.Time
	DroppedSinceStart     uint64
	ProcessStartedAt      time.Time
}

func NewRuntimeHealth(processStartedAt time.Time) *RuntimeHealth {
	health := &RuntimeHealth{processStartedAt: processStartedAt.UTC()}
	health.state.Store(healthState{DatabaseState: DatabaseAvailable, Reason: ReasonNone})
	return health
}

func (health *RuntimeHealth) RecordSuccessfulWrite(at time.Time) {
	health.lastSuccessfulWriteMS.Store(at.UTC().UnixMilli())
	health.state.Store(healthState{DatabaseState: DatabaseAvailable, Reason: ReasonNone})
}

func (health *RuntimeHealth) RecordDropped(reason HealthReason) {
	health.droppedSinceStart.Add(1)
	health.state.Store(healthState{DatabaseState: DatabaseDegraded, Reason: reason})
}

func (health *RuntimeHealth) SetDatabaseState(state DatabaseState, reason HealthReason) {
	health.state.Store(healthState{DatabaseState: state, Reason: reason})
}

func (health *RuntimeHealth) Snapshot() RuntimeHealthSnapshot {
	current := health.state.Load().(healthState)
	result := RuntimeHealthSnapshot{
		DatabaseState:     current.DatabaseState,
		Reason:            current.Reason,
		DroppedSinceStart: health.droppedSinceStart.Load(),
		ProcessStartedAt:  health.processStartedAt,
	}
	if milliseconds := health.lastSuccessfulWriteMS.Load(); milliseconds != 0 {
		value := time.UnixMilli(milliseconds).UTC()
		result.LastSuccessfulWriteAt = &value
	}
	return result
}
