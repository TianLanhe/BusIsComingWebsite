package application

import (
	"context"
	"fmt"

	"busiscoming-website/backend/internal/downloads/domain"
)

type DownloadCurrentAPK struct {
	repository ArtifactRepository
	checksum   ChecksumCalculator
}

func NewDownloadCurrentAPK(repository ArtifactRepository, checksum ChecksumCalculator) *DownloadCurrentAPK {
	return &DownloadCurrentAPK{repository: repository, checksum: checksum}
}

func (usecase *DownloadCurrentAPK) Execute(ctx context.Context) (domain.DownloadResult, error) {
	artifact, err := usecase.repository.CurrentArtifact(ctx)
	if err != nil {
		return domain.DownloadResult{}, err
	}
	if err := artifact.Metadata.Validate(); err != nil {
		return domain.DownloadResult{}, domain.NewDownloadError(domain.CodeDownloadInternal, fmt.Sprintf("Current APK metadata is invalid: %v", err))
	}

	actualSize := artifact.ActualSizeBytes()
	if actualSize != artifact.Metadata.SizeBytes {
		return domain.DownloadResult{}, &domain.DownloadError{
			Code:              domain.CodeAPKChecksumMismatch,
			Message:           "Current Android APK size does not match recorded metadata.",
			ExpectedSHA256:    domain.StringPtr(artifact.Metadata.ExpectedSHA256()),
			ExpectedSizeBytes: domain.Int64Ptr(artifact.Metadata.SizeBytes),
			ActualSizeBytes:   domain.Int64Ptr(actualSize),
		}
	}

	actualSHA256, err := usecase.checksum.SHA256(ctx, artifact.Content)
	if err != nil {
		return domain.DownloadResult{}, domain.NewDownloadError(domain.CodeDownloadInternal, "Android APK checksum calculation failed.")
	}
	if actualSHA256 != artifact.Metadata.ExpectedSHA256() {
		return domain.DownloadResult{}, &domain.DownloadError{
			Code:              domain.CodeAPKChecksumMismatch,
			Message:           "Current Android APK does not match recorded metadata.",
			ExpectedSHA256:    domain.StringPtr(artifact.Metadata.ExpectedSHA256()),
			ActualSHA256:      domain.StringPtr(actualSHA256),
			ExpectedSizeBytes: domain.Int64Ptr(artifact.Metadata.SizeBytes),
			ActualSizeBytes:   domain.Int64Ptr(actualSize),
		}
	}

	return domain.DownloadResult{
		Metadata: artifact.Metadata,
		Content:  artifact.Content,
		SHA256:   actualSHA256,
	}, nil
}
