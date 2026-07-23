package application

import (
	"context"

	"busiscoming-website/backend/internal/downloads/domain"
)

type ArtifactRepository interface {
	CurrentArtifact(ctx context.Context) (domain.Artifact, error)
}

// MetadataRepository 与 APK bytes 下载端口分离，保证版本展示失败或变更不会扩大为下载故障。
type MetadataRepository interface {
	CurrentMetadata(ctx context.Context) (domain.CurrentAPK, error)
}

type ChecksumCalculator interface {
	SHA256(ctx context.Context, content []byte) (string, error)
}
