package application

import (
	"context"
	"errors"

	"busiscoming-website/backend/internal/downloads/domain"
)

const latestAndroidAPKDownloadURL = "/api/downloads/android/latest"

type LatestAPKMetadata struct {
	Platform    string `json:"platform"`
	Status      string `json:"status"`
	VersionName string `json:"versionName"`
	VersionCode int    `json:"versionCode"`
	FileName    string `json:"fileName"`
	SizeBytes   int64  `json:"sizeBytes"`
	LastUpdated string `json:"lastUpdated"`
	DownloadURL string `json:"downloadUrl"`
}

type GetLatestAPKMetadata struct {
	repository MetadataRepository
}

func NewGetLatestAPKMetadata(repository MetadataRepository) *GetLatestAPKMetadata {
	return &GetLatestAPKMetadata{repository: repository}
}

func (usecase *GetLatestAPKMetadata) Execute(ctx context.Context) (LatestAPKMetadata, error) {
	metadata, err := usecase.repository.CurrentMetadata(ctx)
	if err != nil {
		var controlled *domain.DownloadError
		if errors.As(err, &controlled) {
			return LatestAPKMetadata{}, err
		}
		return LatestAPKMetadata{}, domain.NewDownloadError(domain.CodeDownloadInternal, "metadata repository failed")
	}
	if err := metadata.ValidatePublicMetadata(); err != nil {
		return LatestAPKMetadata{}, domain.NewDownloadError(domain.CodeAPKMetadataInvalid, "metadata validation failed")
	}
	return LatestAPKMetadata{
		Platform: metadata.Platform, Status: metadata.Status, VersionName: metadata.VersionName,
		VersionCode: metadata.VersionCode, FileName: metadata.FileName, SizeBytes: metadata.SizeBytes,
		LastUpdated: metadata.LastUpdated, DownloadURL: latestAndroidAPKDownloadURL,
	}, nil
}
