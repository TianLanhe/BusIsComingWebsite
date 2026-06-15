package domain

import "testing"

func TestIsValidSHA256(t *testing.T) {
	if !IsValidSHA256("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad") {
		t.Fatal("expected lowercase 64-character hex hash to be valid")
	}
	if IsValidSHA256("BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD") {
		t.Fatal("expected uppercase hash to be invalid")
	}
	if IsValidSHA256("abc") {
		t.Fatal("expected short hash to be invalid")
	}
}
