package application

import "busiscoming-website/backend/internal/routes/domain"

func RecoverTask(logger Logger, requestID string, taskName string) {
	if recovered := recover(); recovered != nil && logger != nil {
		logger.Info(domain.QueryLogEvent{
			RequestID:   requestID,
			OperationID: "queryRouteEtas",
			Stage:       "panic_recovery",
			ErrorCode:   string(domain.ErrInternal),
			Fields: map[string]any{
				"taskName": taskName,
				"error":    recovered,
			},
		})
	}
}
