package filesystem

import (
	"context"
	"testing"
)

func TestArtifactRepositoryMetadataContainsMaintainerFields(t *testing.T) {
	root := writeRepositoryFixture(t, "abc")

	artifact, err := NewArtifactRepository(root).CurrentArtifact(context.Background())
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if artifact.Metadata.SourcePath == "" {
		t.Fatal("expected sourcePath for maintainer verification")
	}
	if artifact.Metadata.SizeBytes != int64(len(artifact.Content)) {
		t.Fatalf("expected metadata size to match content size")
	}
}
