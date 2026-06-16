package filesystem

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"time"

	"busiscoming-website/backend/internal/downloads/domain"
)

type ArtifactRepository struct {
	root string

	mu     sync.Mutex
	cached *cachedArtifact
}

// cachedArtifact 缓存上一次读取的 Artifact 及其底层文件的修改时间，
// 避免每次下载请求都重新读取 5MB APK 文件和解析 JSON 元数据。
type cachedArtifact struct {
	artifact        domain.Artifact
	apkModTime      time.Time
	metadataModTime time.Time
}

func NewArtifactRepository(root string) *ArtifactRepository {
	return &ArtifactRepository{root: root}
}

func (repository *ArtifactRepository) CurrentArtifact(ctx context.Context) (domain.Artifact, error) {
	select {
	case <-ctx.Done():
		return domain.Artifact{}, ctx.Err()
	default:
	}

	repository.mu.Lock()
	defer repository.mu.Unlock()

	metaPath := filepath.Join(repository.root, "current.json")
	metaStat, err := os.Stat(metaPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return domain.Artifact{}, domain.NewDownloadError(domain.CodeAPKMissing, "Current Android APK metadata is not available.")
		}
		return domain.Artifact{}, domain.NewDownloadError(domain.CodeAPKUnreadable, "Current Android APK metadata cannot be read.")
	}

	// 元数据文件未变化时复用缓存的元数据，避免重复解析 JSON
	metadataChanged := repository.cached == nil || metaStat.ModTime().After(repository.cached.metadataModTime)
	var metadata domain.CurrentAPK
	if metadataChanged {
		metadata, err = repository.readMetadata()
		if err != nil {
			return domain.Artifact{}, err
		}
	} else {
		metadata = repository.cached.artifact.Metadata
	}

	apkPath := repository.apkPath(metadata)
	apkStat, err := os.Stat(apkPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return domain.Artifact{}, &domain.DownloadError{
				Code:              domain.CodeAPKMissing,
				Message:           "Current Android APK is not available.",
				ExpectedSHA256:    domain.StringPtr(metadata.ExpectedSHA256()),
				ExpectedSizeBytes: domain.Int64Ptr(metadata.SizeBytes),
			}
		}
		return domain.Artifact{}, &domain.DownloadError{
			Code:              domain.CodeAPKUnreadable,
			Message:           "Current Android APK cannot be read.",
			ExpectedSHA256:    domain.StringPtr(metadata.ExpectedSHA256()),
			ExpectedSizeBytes: domain.Int64Ptr(metadata.SizeBytes),
		}
	}

	// 元数据和 APK 文件均未变化时直接返回缓存，避免 5MB 文件 I/O
	if !metadataChanged && !apkStat.ModTime().After(repository.cached.apkModTime) {
		return repository.cached.artifact, nil
	}

	content, err := os.ReadFile(apkPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return domain.Artifact{}, &domain.DownloadError{
				Code:              domain.CodeAPKMissing,
				Message:           "Current Android APK is not available.",
				ExpectedSHA256:    domain.StringPtr(metadata.ExpectedSHA256()),
				ExpectedSizeBytes: domain.Int64Ptr(metadata.SizeBytes),
			}
		}
		return domain.Artifact{}, &domain.DownloadError{
			Code:              domain.CodeAPKUnreadable,
			Message:           "Current Android APK cannot be read.",
			ExpectedSHA256:    domain.StringPtr(metadata.ExpectedSHA256()),
			ExpectedSizeBytes: domain.Int64Ptr(metadata.SizeBytes),
		}
	}

	artifact := domain.Artifact{Metadata: metadata, Content: content}
	repository.cached = &cachedArtifact{
		artifact:        artifact,
		apkModTime:      apkStat.ModTime(),
		metadataModTime: metaStat.ModTime(),
	}
	return artifact, nil
}

func (repository *ArtifactRepository) readMetadata() (domain.CurrentAPK, error) {
	raw, err := os.ReadFile(filepath.Join(repository.root, "current.json"))
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return domain.CurrentAPK{}, domain.NewDownloadError(domain.CodeAPKMissing, "Current Android APK metadata is not available.")
		}
		return domain.CurrentAPK{}, domain.NewDownloadError(domain.CodeAPKUnreadable, "Current Android APK metadata cannot be read.")
	}

	var metadata domain.CurrentAPK
	if err := json.Unmarshal(raw, &metadata); err != nil {
		return domain.CurrentAPK{}, domain.NewDownloadError(domain.CodeDownloadInternal, "Current Android APK metadata is invalid JSON.")
	}
	return metadata, nil
}

func (repository *ArtifactRepository) apkPath(metadata domain.CurrentAPK) string {
	fileName := filepath.Base(metadata.FileName)
	if metadata.RelativePath != "" {
		fileName = filepath.Base(metadata.RelativePath)
	}
	return filepath.Join(repository.root, fileName)
}
