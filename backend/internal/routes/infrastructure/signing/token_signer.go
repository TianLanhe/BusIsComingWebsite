package signing

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"busiscoming-website/backend/internal/routes/domain"
)

type TokenSigner struct {
	secret []byte
	now    func() time.Time
}

func NewTokenSigner(secret []byte, now func() time.Time) *TokenSigner {
	if len(secret) == 0 {
		secret = []byte("busiscoming-route-query-dev-secret")
	}
	if now == nil {
		now = time.Now
	}
	return &TokenSigner{secret: secret, now: now}
}

func (s *TokenSigner) SignPlace(payload domain.PlaceTokenPayload) (string, time.Time, error) {
	now := s.now().UTC()
	// placeToken 只封装已选候选地点的必要上下文，15 分钟后过期，避免前端提交裸经纬度或长期复用。
	payload.Subject = domain.TokenSubjectPlace
	payload.IssuedAt = now
	payload.ExpiresAt = now.Add(15 * time.Minute)
	payload.Provider = firstNonEmpty(payload.Provider, "citybus")
	token, err := s.sign(payload)
	return token, payload.ExpiresAt, err
}

func (s *TokenSigner) VerifyPlace(token string) (domain.PlaceTokenPayload, error) {
	var payload domain.PlaceTokenPayload
	if err := s.verify(token, &payload); err != nil {
		return payload, err
	}
	if payload.Subject != domain.TokenSubjectPlace {
		return payload, errors.New("invalid place token subject")
	}
	if !s.now().UTC().Before(payload.ExpiresAt) {
		return payload, errors.New("place token expired")
	}
	return payload, nil
}

func (s *TokenSigner) SignEta(payload domain.EtaTokenPayload) (string, time.Time, error) {
	now := s.now().UTC()
	// etaToken 只服务当前路线结果的首程候车查询，过期时间短于 placeToken，失败时前端保留路线摘要。
	payload.Subject = domain.TokenSubjectEta
	payload.IssuedAt = now
	payload.ExpiresAt = now.Add(5 * time.Minute)
	token, err := s.sign(payload)
	return token, payload.ExpiresAt, err
}

func (s *TokenSigner) VerifyEta(token string) (domain.EtaTokenPayload, error) {
	var payload domain.EtaTokenPayload
	if err := s.verify(token, &payload); err != nil {
		return payload, err
	}
	if payload.Subject != domain.TokenSubjectEta {
		return payload, errors.New("invalid eta token subject")
	}
	if !s.now().UTC().Before(payload.ExpiresAt) {
		return payload, errors.New("eta token expired")
	}
	return payload, nil
}

func (s *TokenSigner) sign(payload any) (string, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	signature := s.signature(body)
	return encode(body) + "." + encode(signature), nil
}

func (s *TokenSigner) verify(token string, payload any) error {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return errors.New("invalid token format")
	}
	body, err := decode(parts[0])
	if err != nil {
		return err
	}
	signature, err := decode(parts[1])
	if err != nil {
		return err
	}
	if !hmac.Equal(signature, s.signature(body)) {
		return errors.New("invalid token signature")
	}
	return json.Unmarshal(body, payload)
}

func (s *TokenSigner) signature(body []byte) []byte {
	mac := hmac.New(sha256.New, s.secret)
	mac.Write(body)
	return mac.Sum(nil)
}

func encode(value []byte) string {
	return base64.RawURLEncoding.EncodeToString(value)
}

func decode(value string) ([]byte, error) {
	return base64.RawURLEncoding.DecodeString(value)
}

func firstNonEmpty(value, fallback string) string {
	if value != "" {
		return value
	}
	return fallback
}
