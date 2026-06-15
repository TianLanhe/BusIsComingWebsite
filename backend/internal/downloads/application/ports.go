package application

import (
	"context"

	"busiscoming-website/backend/internal/downloads/domain"
)

type ArtifactRepository interface {
	CurrentArtifact(ctx context.Context) (domain.Artifact, error)
}

type ChecksumCalculator interface {
	SHA256(ctx context.Context, content []byte) (string, error)
}
