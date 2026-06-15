package downloadhttp

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"busiscoming-website/backend/internal/downloads/domain"
	"github.com/gin-gonic/gin"
)

const (
	apkMediaType = "application/vnd.android.package-archive"
	cacheControl = "no-store"
)

type DownloadUseCase interface {
	Execute(ctx context.Context) (domain.DownloadResult, error)
}

type Handler struct {
	usecase DownloadUseCase
}

func NewHandler(usecase DownloadUseCase) *Handler {
	return &Handler{usecase: usecase}
}

func (handler *Handler) DownloadLatestAndroidAPK(c *gin.Context) {
	result, err := handler.usecase.Execute(c.Request.Context())
	c.Header("Cache-Control", cacheControl)
	if err != nil {
		handler.writeError(c, err)
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, result.Metadata.FileName))
	c.Header("Content-Length", strconv.FormatInt(int64(len(result.Content)), 10))
	c.Header("X-APK-SHA256", result.SHA256)
	c.Header("X-APK-Version-Name", result.Metadata.VersionName)
	c.Header("X-APK-Version-Code", strconv.Itoa(result.Metadata.VersionCode))
	c.Data(http.StatusOK, apkMediaType, result.Content)
}

func (handler *Handler) writeError(c *gin.Context, err error) {
	var downloadErr *domain.DownloadError
	if !errors.As(err, &downloadErr) {
		downloadErr = domain.NewDownloadError(domain.CodeDownloadInternal, "Android APK download service failed.")
	}

	status := http.StatusInternalServerError
	switch downloadErr.Code {
	case domain.CodeAPKMissing:
		status = http.StatusNotFound
	case domain.CodeAPKChecksumMismatch:
		status = http.StatusConflict
	case domain.CodeAPKUnreadable, domain.CodeDownloadInternal:
		status = http.StatusInternalServerError
	}

	c.JSON(status, errorResponse{
		Code:              string(downloadErr.Code),
		Message:           downloadErr.Message,
		ExpectedSHA256:    downloadErr.ExpectedSHA256,
		ActualSHA256:      downloadErr.ActualSHA256,
		ExpectedSizeBytes: downloadErr.ExpectedSizeBytes,
		ActualSizeBytes:   downloadErr.ActualSizeBytes,
	})
}

type errorResponse struct {
	Code              string  `json:"code"`
	Message           string  `json:"message"`
	ExpectedSHA256    *string `json:"expectedSha256"`
	ActualSHA256      *string `json:"actualSha256"`
	ExpectedSizeBytes *int64  `json:"expectedSizeBytes"`
	ActualSizeBytes   *int64  `json:"actualSizeBytes"`
}
