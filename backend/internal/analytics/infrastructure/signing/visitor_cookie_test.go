package signing

import (
	"bytes"
	"crypto/rand"
	"net/http"
	"strings"
	"testing"
	"time"
)

func TestVisitorCookieSignerIssuesAndReusesCredential(t *testing.T) {
	now := time.Date(2026, time.July, 22, 10, 0, 0, 0, time.UTC)
	signer := NewVisitorCookieSigner([]byte("0123456789abcdef0123456789abcdef"), func() time.Time { return now }, bytes.NewReader(bytes.Repeat([]byte{0x11}, 64)))
	issued, err := signer.Resolve("")
	if err != nil {
		t.Fatal(err)
	}
	if issued.Reused || len(issued.VisitorID) != 22 || !strings.HasPrefix(issued.Value, "v1.") {
		t.Fatalf("unexpected issued credential: %#v", issued)
	}
	reused, err := signer.Resolve(issued.Value)
	if err != nil {
		t.Fatal(err)
	}
	if !reused.Reused || reused.VisitorID != issued.VisitorID || reused.Value != issued.Value {
		t.Fatalf("credential was not reused: %#v", reused)
	}
}

func TestVisitorCookieSignerRotatesTamperedExpiredAndOldSecret(t *testing.T) {
	base := time.Date(2026, time.July, 22, 10, 0, 0, 0, time.UTC)
	current := base
	randomValues := append(bytes.Repeat([]byte{0x11}, 16), bytes.Repeat([]byte{0x22}, 16)...)
	randomValues = append(randomValues, bytes.Repeat([]byte{0x33}, 16)...)
	randomValues = append(randomValues, bytes.Repeat([]byte{0x44}, 16)...)
	reader := bytes.NewReader(randomValues)
	signer := NewVisitorCookieSigner([]byte("0123456789abcdef0123456789abcdef"), func() time.Time { return current }, reader)
	issued, err := signer.Resolve("")
	if err != nil {
		t.Fatal(err)
	}

	for name, value := range map[string]string{
		"tampered":  issued.Value[:len(issued.Value)-1] + differentLastCharacter(issued.Value[len(issued.Value)-1]),
		"oldSecret": resignWithSecret(t, issued.Value, []byte("fedcba9876543210fedcba9876543210")),
	} {
		t.Run(name, func(t *testing.T) {
			rotated, err := signer.Resolve(value)
			if err != nil {
				t.Fatal(err)
			}
			if rotated.Reused || rotated.VisitorID == issued.VisitorID {
				t.Fatalf("expected rotation: %#v", rotated)
			}
		})
	}

	current = base.AddDate(1, 0, 0).Add(time.Millisecond)
	rotated, err := signer.Resolve(issued.Value)
	if err != nil {
		t.Fatal(err)
	}
	if rotated.Reused || rotated.VisitorID == issued.VisitorID {
		t.Fatalf("expired credential was reused: %#v", rotated)
	}
}

func differentLastCharacter(value byte) string {
	if value == 'A' {
		return "B"
	}
	return "A"
}

func TestVisitorIDsAreRandomAndUnique(t *testing.T) {
	signer := NewVisitorCookieSigner([]byte("0123456789abcdef0123456789abcdef"), time.Now, rand.Reader)
	seen := map[string]bool{}
	for index := 0; index < 128; index++ {
		credential, err := signer.Resolve("")
		if err != nil {
			t.Fatal(err)
		}
		if seen[credential.VisitorID] {
			t.Fatalf("duplicate visitor ID at sample %d", index)
		}
		seen[credential.VisitorID] = true
	}
}

func TestVisitorCookieHasAllHostCookieAttributes(t *testing.T) {
	now := time.Date(2026, time.July, 22, 10, 0, 0, 0, time.UTC)
	expiresAt := now.AddDate(1, 0, 0)
	cookie := VisitorCookie("signed-value", expiresAt, now)
	if cookie.Name != "__Host-bic-visitor" || cookie.Path != "/" || cookie.Domain != "" {
		t.Fatalf("invalid __Host- scope: %#v", cookie)
	}
	if !cookie.HttpOnly || !cookie.Secure || cookie.SameSite != http.SameSiteLaxMode {
		t.Fatalf("missing security attributes: %#v", cookie)
	}
	if !cookie.Expires.Equal(expiresAt) || cookie.MaxAge != int(expiresAt.Sub(now).Seconds()) {
		t.Fatalf("invalid one-year expiry: %#v", cookie)
	}
}

func TestSignatureComparisonRejectsPrefixAndSuffixChanges(t *testing.T) {
	original := bytes.Repeat([]byte{0x5a}, 32)
	changedPrefix := append([]byte(nil), original...)
	changedPrefix[0]++
	changedSuffix := append([]byte(nil), original...)
	changedSuffix[len(changedSuffix)-1]++
	if !signaturesEqual(original, original) || signaturesEqual(original, changedPrefix) || signaturesEqual(original, changedSuffix) {
		t.Fatal("signature comparison returned an invalid result")
	}
}

func resignWithSecret(t *testing.T, value string, secret []byte) string {
	t.Helper()
	parts := strings.Split(value, ".")
	if len(parts) != 4 {
		t.Fatalf("unexpected cookie format: %s", value)
	}
	parts[3] = encodeSignature(secret, strings.Join(parts[:3], "."))
	return strings.Join(parts, ".")
}
