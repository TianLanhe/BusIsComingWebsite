package signing

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const (
	VisitorCookieName = "__Host-bic-visitor"
	cookieVersion     = "v1"
	maximumClockSkew  = 5 * time.Minute
)

var encodedVisitorPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{22}$`)

type VisitorCredential struct {
	VisitorID string
	IssuedAt  time.Time
	ExpiresAt time.Time
	Value     string
	Reused    bool
}

type VisitorCookieSigner struct {
	secret []byte
	clock  func() time.Time
	random io.Reader
}

func NewVisitorCookieSigner(secret []byte, clock func() time.Time, random io.Reader) *VisitorCookieSigner {
	return &VisitorCookieSigner{secret: append([]byte(nil), secret...), clock: clock, random: random}
}

func (signer *VisitorCookieSigner) Resolve(raw string) (VisitorCredential, error) {
	if credential, ok := signer.verify(raw); ok {
		credential.Reused = true
		return credential, nil
	}
	return signer.issue()
}

func (signer *VisitorCookieSigner) verify(raw string) (VisitorCredential, bool) {
	parts := strings.Split(raw, ".")
	if len(parts) != 4 || parts[0] != cookieVersion || !encodedVisitorPattern.MatchString(parts[1]) {
		return VisitorCredential{}, false
	}
	issuedSeconds, err := strconv.ParseInt(parts[2], 10, 64)
	if err != nil {
		return VisitorCredential{}, false
	}
	issuedAt := time.Unix(issuedSeconds, 0).UTC()
	now := signer.clock().UTC()
	expiresAt := issuedAt.AddDate(1, 0, 0)
	if issuedAt.After(now.Add(maximumClockSkew)) || now.After(expiresAt) {
		return VisitorCredential{}, false
	}
	expected, err := base64.RawURLEncoding.DecodeString(encodeSignature(signer.secret, strings.Join(parts[:3], ".")))
	if err != nil {
		return VisitorCredential{}, false
	}
	actual, err := base64.RawURLEncoding.DecodeString(parts[3])
	if err != nil || !signaturesEqual(expected, actual) {
		return VisitorCredential{}, false
	}
	return VisitorCredential{VisitorID: parts[1], IssuedAt: issuedAt, ExpiresAt: expiresAt, Value: raw}, true
}

func (signer *VisitorCookieSigner) issue() (VisitorCredential, error) {
	if len(signer.secret) < 32 || signer.clock == nil || signer.random == nil {
		return VisitorCredential{}, fmt.Errorf("visitor credential signer is unavailable")
	}
	randomID := make([]byte, 16)
	if _, err := io.ReadFull(signer.random, randomID); err != nil {
		return VisitorCredential{}, fmt.Errorf("generate visitor credential: %w", err)
	}
	issuedAt := signer.clock().UTC().Truncate(time.Second)
	visitorID := base64.RawURLEncoding.EncodeToString(randomID)
	payload := strings.Join([]string{cookieVersion, visitorID, strconv.FormatInt(issuedAt.Unix(), 10)}, ".")
	value := payload + "." + encodeSignature(signer.secret, payload)
	return VisitorCredential{
		VisitorID: visitorID,
		IssuedAt:  issuedAt,
		ExpiresAt: issuedAt.AddDate(1, 0, 0),
		Value:     value,
	}, nil
}

func VisitorCookie(value string, expiresAt, now time.Time) *http.Cookie {
	return &http.Cookie{
		Name:     VisitorCookieName,
		Value:    value,
		Path:     "/",
		Expires:  expiresAt,
		MaxAge:   int(expiresAt.Sub(now).Seconds()),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	}
}

func encodeSignature(secret []byte, payload string) string {
	mac := hmac.New(sha256.New, secret)
	_, _ = mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func signaturesEqual(expected, actual []byte) bool {
	return hmac.Equal(expected, actual)
}
