package filesystem

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	"busiscoming-website/backend/internal/downloads/domain"
)

type ArtifactRepository struct {
	root string
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

	metadata, err := repository.readMetadata()
	if err != nil {
		return domain.Artifact{}, err
	}

	content, err := os.ReadFile(repository.apkPath(metadata))
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

	return domain.Artifact{Metadata: metadata, Content: content}, nil
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
