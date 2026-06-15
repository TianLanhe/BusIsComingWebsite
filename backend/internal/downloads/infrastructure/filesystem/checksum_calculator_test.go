package filesystem

import (
	"context"
	"testing"
)

func TestChecksumCalculatorSHA256(t *testing.T) {
	hash, err := NewChecksumCalculator().SHA256(context.Background(), []byte("abc"))
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if hash != "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" {
		t.Fatalf("unexpected hash %s", hash)
	}
}
