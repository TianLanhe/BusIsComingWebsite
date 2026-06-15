package domain

import "testing"

func validMetadata() CurrentAPK {
	return CurrentAPK{
		Platform:      "android",
		AppName:       "BusIsComing",
		ApplicationID: "com.example.busiscoming",
		VersionName:   "1.0",
		VersionCode:   1,
		FileName:      "BusIsComing.apk",
		RelativePath:  "BusIsComing.apk",
		SizeBytes:     3,
		SHA256:        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		LastUpdated:   "2026-06-16",
		Status:        "available",
	}
}

func TestCurrentAPKValidateAcceptsCurrentAndroidAPK(t *testing.T) {
	if err := validMetadata().Validate(); err != nil {
		t.Fatalf("expected valid metadata, got %v", err)
	}
}

func TestCurrentAPKValidateRejectsInvalidSHA(t *testing.T) {
	metadata := validMetadata()
	metadata.SHA256 = "not-a-sha"

	if err := metadata.Validate(); err == nil {
		t.Fatal("expected invalid sha256 to fail")
	}
}

func TestArtifactActualSizeBytes(t *testing.T) {
	artifact := Artifact{Metadata: validMetadata(), Content: []byte("abc")}

	if artifact.ActualSizeBytes() != 3 {
		t.Fatalf("expected size 3, got %d", artifact.ActualSizeBytes())
	}
}
