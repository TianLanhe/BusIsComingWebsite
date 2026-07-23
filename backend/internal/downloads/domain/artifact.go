package domain

import (
	"fmt"
	"strings"
	"time"
)

type LocalizedString map[string]string

type CurrentAPK struct {
	Platform      string          `json:"platform"`
	AppName       string          `json:"appName"`
	ApplicationID string          `json:"applicationId"`
	VersionName   string          `json:"versionName"`
	VersionCode   int             `json:"versionCode"`
	FileName      string          `json:"fileName"`
	RelativePath  string          `json:"relativePath"`
	SourcePath    string          `json:"sourcePath"`
	SizeBytes     int64           `json:"sizeBytes"`
	SizeLabel     LocalizedString `json:"sizeLabel"`
	SHA256        string          `json:"sha256"`
	LastUpdated   string          `json:"lastUpdated"`
	Status        string          `json:"status"`
}

// ValidatePublicMetadata 校验主页接口依赖的 manifest 事实，避免把路径、无效日期或旧的占位值
// 传到浏览器。下载用例仍会独立校验 APK bytes 和校验和，两条失败路径互不影响。
func (metadata CurrentAPK) ValidatePublicMetadata() error {
	if err := metadata.Validate(); err != nil {
		return err
	}
	if metadata.Status != "available" {
		return fmt.Errorf("status must be available")
	}
	if strings.ContainsAny(metadata.FileName, `/\\`) {
		return fmt.Errorf("fileName must be a basename")
	}
	if len(metadata.VersionName) > 64 {
		return fmt.Errorf("versionName is too long")
	}
	parsed, err := time.Parse("2006-01-02", metadata.LastUpdated)
	if err != nil || parsed.Format("2006-01-02") != metadata.LastUpdated {
		return fmt.Errorf("lastUpdated must be an ISO date")
	}
	return nil
}

type Artifact struct {
	Metadata CurrentAPK
	Content  []byte
}

func (metadata CurrentAPK) Validate() error {
	if metadata.Platform != "android" {
		return fmt.Errorf("unexpected platform %q", metadata.Platform)
	}
	if metadata.FileName == "" {
		return fmt.Errorf("fileName is required")
	}
	if metadata.SizeBytes <= 0 {
		return fmt.Errorf("sizeBytes must be positive")
	}
	if !IsValidSHA256(metadata.SHA256) {
		return fmt.Errorf("sha256 must be a 64-character lowercase hex string")
	}
	if metadata.VersionName == "" || metadata.VersionCode <= 0 {
		return fmt.Errorf("versionName and versionCode are required")
	}
	if metadata.Status == "" {
		return fmt.Errorf("status is required")
	}
	return nil
}

func (metadata CurrentAPK) ExpectedSHA256() string {
	return strings.ToLower(metadata.SHA256)
}

func (artifact Artifact) ActualSizeBytes() int64 {
	return int64(len(artifact.Content))
}
