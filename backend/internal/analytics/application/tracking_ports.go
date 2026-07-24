package application

import (
	"time"

	"busiscoming-website/backend/internal/analytics/domain"
)

// VisitorCredential 是 HTTP Cookie 适配器与采集用例之间传递的最小匿名凭据；
// 它不携带完整 Cookie 的持久化或日志语义。
type VisitorCredential struct {
	VisitorID string
	IssuedAt  time.Time
	ExpiresAt time.Time
	Value     string
	Reused    bool
}

// VisitorSigner 将签名实现留在基础设施层，接口适配层只依赖匿名凭据端口。
type VisitorSigner interface {
	Resolve(raw string) (VisitorCredential, error)
}

// EventClassifier 把瞬时请求头归一为有限领域值，防止 HTTP 层依赖具体分类实现。
type EventClassifier interface {
	IsKnownBot(userAgent string) bool
	Device(userAgent string) domain.DeviceType
	Source(raw string) domain.SourceType
	Locale(homeLocale, bodyLocale, acceptLanguage string) domain.Locale
}
