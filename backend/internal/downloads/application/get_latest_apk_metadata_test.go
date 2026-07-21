package application

import (
	"context"
	"errors"
	"testing"

	"busiscoming-website/backend/internal/downloads/domain"
)

type fakeMetadataRepository struct {
	metadata domain.CurrentAPK
	err      error
}

func (repository fakeMetadataRepository) CurrentMetadata(context.Context) (domain.CurrentAPK, error) {
	return repository.metadata, repository.err
}

func TestGetLatestAPKMetadataReturnsOnlyPublicFields(t *testing.T) {
	metadata := appMetadata()
	metadata.SourcePath = "/private/build/app-release.apk"
	metadata.RelativePath = "nested/BusIsComing.apk"
	usecase := NewGetLatestAPKMetadata(fakeMetadataRepository{metadata: metadata})

	result, err := usecase.Execute(context.Background())
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if result.VersionName != "1.0" || result.VersionCode != 1 || result.SizeBytes != 3 {
		t.Fatalf("unexpected metadata result %#v", result)
	}
	if result.FileName != "BusIsComing.apk" || result.DownloadURL != "/api/downloads/android/latest" {
		t.Fatalf("expected basename and stable download URL, got %#v", result)
	}
}

func TestGetLatestAPKMetadataPreservesControlledRepositoryErrors(t *testing.T) {
	want := domain.NewDownloadError(domain.CodeAPKMetadataMissing, "missing")
	_, err := NewGetLatestAPKMetadata(fakeMetadataRepository{err: want}).Execute(context.Background())
	if !errors.Is(err, want) {
		t.Fatalf("expected repository error, got %v", err)
	}
}

func TestGetLatestAPKMetadataRejectsInvalidManifest(t *testing.T) {
	metadata := appMetadata()
	metadata.LastUpdated = "yesterday"
	_, err := NewGetLatestAPKMetadata(fakeMetadataRepository{metadata: metadata}).Execute(context.Background())
	var downloadErr *domain.DownloadError
	if !errors.As(err, &downloadErr) || downloadErr.Code != domain.CodeAPKMetadataInvalid {
		t.Fatalf("expected metadata invalid error, got %v", err)
	}
}
