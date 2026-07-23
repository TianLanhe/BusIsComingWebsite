package filesystem

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"busiscoming-website/backend/internal/downloads/domain"
)

func TestArtifactRepositoryReadsMetadataWithoutReadingAPKBytes(t *testing.T) {
	root := writeRepositoryFixture(t, "")
	metadata, err := NewArtifactRepository(root).CurrentMetadata(context.Background())
	if err != nil {
		t.Fatalf("metadata must not require the APK file: %v", err)
	}
	if metadata.VersionName != "1.0" || metadata.SizeBytes != 3 {
		t.Fatalf("unexpected metadata %#v", metadata)
	}
}

func TestArtifactRepositoryMetadataValidatesManifestFields(t *testing.T) {
	cases := map[string]string{
		"non basename":  strings.Replace(validManifestJSON(), `"fileName": "BusIsComing.apk"`, `"fileName": "nested/BusIsComing.apk"`, 1),
		"empty version": strings.Replace(validManifestJSON(), `"versionName": "1.0"`, `"versionName": ""`, 1),
		"invalid code":  strings.Replace(validManifestJSON(), `"versionCode": 1`, `"versionCode": 0`, 1),
		"invalid size":  strings.Replace(validManifestJSON(), `"sizeBytes": 3`, `"sizeBytes": 0`, 1),
		"invalid date":  strings.Replace(validManifestJSON(), `"lastUpdated": "2026-06-16"`, `"lastUpdated": "16/06/2026"`, 1),
	}
	for name, manifest := range cases {
		t.Run(name, func(t *testing.T) {
			root := t.TempDir()
			if err := os.WriteFile(filepath.Join(root, "current.json"), []byte(manifest), 0o644); err != nil {
				t.Fatal(err)
			}
			_, err := NewArtifactRepository(root).CurrentMetadata(context.Background())
			var downloadErr *domain.DownloadError
			if !errors.As(err, &downloadErr) || downloadErr.Code != domain.CodeAPKMetadataInvalid {
				t.Fatalf("expected invalid metadata error, got %v", err)
			}
		})
	}
}

func TestArtifactRepositoryMetadataMapsMissingAndInvalidJSON(t *testing.T) {
	repository := NewArtifactRepository(t.TempDir())
	_, err := repository.CurrentMetadata(context.Background())
	assertMetadataCode(t, err, domain.CodeAPKMetadataMissing)

	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "current.json"), []byte("{"), 0o644); err != nil {
		t.Fatal(err)
	}
	_, err = NewArtifactRepository(root).CurrentMetadata(context.Background())
	assertMetadataCode(t, err, domain.CodeAPKMetadataInvalid)
}

func assertMetadataCode(t *testing.T, err error, code domain.ErrorCode) {
	t.Helper()
	var downloadErr *domain.DownloadError
	if !errors.As(err, &downloadErr) || downloadErr.Code != code {
		t.Fatalf("expected %s, got %v", code, err)
	}
}

func validManifestJSON() string {
	return `{
  "platform": "android",
  "appName": "BusIsComing",
  "applicationId": "com.example.busiscoming",
  "versionName": "1.0",
  "versionCode": 1,
  "fileName": "BusIsComing.apk",
  "relativePath": "BusIsComing.apk",
  "sourcePath": "/private/source/BusIsComing.apk",
  "sizeBytes": 3,
  "sizeLabel": {"zh-Hant": "約 4.8 MB", "zh-Hans": "约 4.8 MB", "en": "About 4.8 MB"},
  "sha256": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  "lastUpdated": "2026-06-16",
  "status": "available"
}`
}
