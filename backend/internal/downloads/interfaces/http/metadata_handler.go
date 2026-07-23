package downloadhttp

import (
	"context"
	"errors"
	"net/http"

	analyticshttp "busiscoming-website/backend/internal/analytics/interfaces/http"
	"busiscoming-website/backend/internal/downloads/application"
	"busiscoming-website/backend/internal/downloads/domain"
	platformhttp "busiscoming-website/backend/internal/platform/httpserver"
	"github.com/gin-gonic/gin"
)

type MetadataUseCase interface {
	Execute(ctx context.Context) (application.LatestAPKMetadata, error)
}

func (handler *Handler) GetLatestAndroidAPKMetadata(c *gin.Context) {
	platformhttp.SetRequestMetadata(c, "getLatestAndroidApkMetadata", "downloads")
	c.Header("Cache-Control", cacheControl)
	if handler.metadataUsecase == nil {
		handler.writeMetadataError(c, domain.NewDownloadError(domain.CodeDownloadInternal, "metadata use case unavailable"))
		return
	}
	result, err := handler.metadataUsecase.Execute(c.Request.Context())
	if err != nil {
		analyticshttp.ObserveFailure(c, analyticsDownloadFailure(err))
		handler.writeMetadataError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (handler *Handler) writeMetadataError(c *gin.Context, err error) {
	code := domain.CodeDownloadInternal
	status := http.StatusInternalServerError
	var downloadErr *domain.DownloadError
	if errors.As(err, &downloadErr) {
		code = downloadErr.Code
	}
	if code == domain.CodeAPKMetadataMissing {
		status = http.StatusNotFound
	}
	switch code {
	case domain.CodeAPKMetadataMissing, domain.CodeAPKMetadataUnreadable, domain.CodeAPKMetadataInvalid, domain.CodeDownloadInternal:
	default:
		code = domain.CodeDownloadInternal
	}
	c.JSON(status, gin.H{"code": code, "message": "当前 Android APK 版本信息暂时不可用。"})
}
