package filesystem

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"busiscoming-website/backend/internal/downloads/domain"
)

func writeRepositoryFixture(t *testing.T, content string) string {
	t.Helper()
	root := t.TempDir()
	metadata := `{
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
	if err := os.WriteFile(filepath.Join(root, "current.json"), []byte(metadata), 0o644); err != nil {
		t.Fatal(err)
	}
	if content != "" {
		if err := os.WriteFile(filepath.Join(root, "BusIsComing.apk"), []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return root
}

func TestArtifactRepositoryReadsCurrentArtifact(t *testing.T) {
	root := writeRepositoryFixture(t, "abc")

	artifact, err := NewArtifactRepository(root).CurrentArtifact(context.Background())
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if artifact.Metadata.VersionName != "1.0" || string(artifact.Content) != "abc" {
		t.Fatalf("unexpected artifact %#v", artifact)
	}
}

func TestArtifactRepositoryReturnsMissingForAbsentAPK(t *testing.T) {
	root := writeRepositoryFixture(t, "")

	_, err := NewArtifactRepository(root).CurrentArtifact(context.Background())
	var downloadErr *domain.DownloadError
	if !errors.As(err, &downloadErr) || downloadErr.Code != domain.CodeAPKMissing {
		t.Fatalf("expected missing error, got %v", err)
	}
}

// TestArtifactRepositoryCachesArtifactOnRepeatedCalls 验证连续调用返回相同的
// Artifact 切片引用，确认不会重复读取磁盘文件。
func TestArtifactRepositoryCachesArtifactOnRepeatedCalls(t *testing.T) {
	root := writeRepositoryFixture(t, "abc")
	repo := NewArtifactRepository(root)

	first, err := repo.CurrentArtifact(context.Background())
	if err != nil {
		t.Fatalf("first call: %v", err)
	}
	second, err := repo.CurrentArtifact(context.Background())
	if err != nil {
		t.Fatalf("second call: %v", err)
	}
	if &first.Content[0] != &second.Content[0] {
		t.Fatal("expected cached artifact to reuse the same content slice")
	}
}

// TestArtifactRepositoryInvalidatesCacheOnFileChange 验证 APK 文件被替换后，
// 缓存自动失效并返回新内容。
func TestArtifactRepositoryInvalidatesCacheOnFileChange(t *testing.T) {
	root := writeRepositoryFixture(t, "abc")
	repo := NewArtifactRepository(root)

	first, err := repo.CurrentArtifact(context.Background())
	if err != nil {
		t.Fatalf("first call: %v", err)
	}
	if string(first.Content) != "abc" {
		t.Fatalf("unexpected first content %q", string(first.Content))
	}

	// 替换 APK 文件内容并确保修改时间不同
	apkPath := filepath.Join(root, "BusIsComing.apk")
	if err := os.WriteFile(apkPath, []byte("xyz"), 0o644); err != nil {
		t.Fatal(err)
	}
	// 显式设置一个更晚的修改时间，避免文件系统精度导致缓存未失效
	futureModTime := time.Now().Add(time.Second)
	if err := os.Chtimes(apkPath, futureModTime, futureModTime); err != nil {
		t.Fatal(err)
	}

	second, err := repo.CurrentArtifact(context.Background())
	if err != nil {
		t.Fatalf("second call: %v", err)
	}
	if string(second.Content) != "xyz" {
		t.Fatalf("expected refreshed content %q, got %q", "xyz", string(second.Content))
	}
}
