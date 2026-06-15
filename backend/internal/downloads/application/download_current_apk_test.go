package application

import (
	"context"
	"errors"
	"testing"

	"busiscoming-website/backend/internal/downloads/domain"
)

type fakeRepository struct {
	artifact domain.Artifact
	err      error
}

func (repo fakeRepository) CurrentArtifact(context.Context) (domain.Artifact, error) {
	return repo.artifact, repo.err
}

type fakeChecksum struct {
	value string
	err   error
}

func (checksum fakeChecksum) SHA256(context.Context, []byte) (string, error) {
	return checksum.value, checksum.err
}

func appMetadata() domain.CurrentAPK {
	return domain.CurrentAPK{
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

func TestDownloadCurrentAPKReturnsVerifiedArtifact(t *testing.T) {
	usecase := NewDownloadCurrentAPK(
		fakeRepository{artifact: domain.Artifact{Metadata: appMetadata(), Content: []byte("abc")}},
		fakeChecksum{value: appMetadata().SHA256},
	)

	result, err := usecase.Execute(context.Background())
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if string(result.Content) != "abc" {
		t.Fatalf("unexpected content %q", string(result.Content))
	}
}

func TestDownloadCurrentAPKPropagatesRepositoryError(t *testing.T) {
	repoErr := domain.NewDownloadError(domain.CodeAPKMissing, "missing")
	usecase := NewDownloadCurrentAPK(fakeRepository{err: repoErr}, fakeChecksum{})

	_, err := usecase.Execute(context.Background())
	if !errors.Is(err, repoErr) {
		t.Fatalf("expected repository error, got %v", err)
	}
}

func TestDownloadCurrentAPKRejectsSizeMismatch(t *testing.T) {
	usecase := NewDownloadCurrentAPK(
		fakeRepository{artifact: domain.Artifact{Metadata: appMetadata(), Content: []byte("abcd")}},
		fakeChecksum{value: appMetadata().SHA256},
	)

	_, err := usecase.Execute(context.Background())
	var downloadErr *domain.DownloadError
	if !errors.As(err, &downloadErr) || downloadErr.Code != domain.CodeAPKChecksumMismatch {
		t.Fatalf("expected checksum mismatch, got %v", err)
	}
}

func TestDownloadCurrentAPKRejectsHashMismatch(t *testing.T) {
	usecase := NewDownloadCurrentAPK(
		fakeRepository{artifact: domain.Artifact{Metadata: appMetadata(), Content: []byte("abc")}},
		fakeChecksum{value: "0000000000000000000000000000000000000000000000000000000000000000"},
	)

	_, err := usecase.Execute(context.Background())
	var downloadErr *domain.DownloadError
	if !errors.As(err, &downloadErr) || downloadErr.Code != domain.CodeAPKChecksumMismatch {
		t.Fatalf("expected checksum mismatch, got %v", err)
	}
}
