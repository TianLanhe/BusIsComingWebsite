package filesystem

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
)

type ChecksumCalculator struct{}

func NewChecksumCalculator() *ChecksumCalculator {
	return &ChecksumCalculator{}
}

func (calculator *ChecksumCalculator) SHA256(ctx context.Context, content []byte) (string, error) {
	select {
	case <-ctx.Done():
		return "", ctx.Err()
	default:
		sum := sha256.Sum256(content)
		return hex.EncodeToString(sum[:]), nil
	}
}
