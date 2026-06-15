package downloadhttp

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"busiscoming-website/backend/internal/downloads/domain"
	"github.com/gin-gonic/gin"
)

type fakeDownloadUseCase struct {
	result domain.DownloadResult
	err    error
}

func (usecase fakeDownloadUseCase) Execute(context.Context) (domain.DownloadResult, error) {
	return usecase.result, usecase.err
}

func handlerMetadata() domain.CurrentAPK {
	return domain.CurrentAPK{
		Platform:      "android",
		AppName:       "BusIsComing",
		ApplicationID: "com.example.busiscoming",
		VersionName:   "1.0",
		VersionCode:   1,
		FileName:      "BusIsComing.apk",
		SizeBytes:     3,
		SHA256:        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		LastUpdated:   "2026-06-16",
		Status:        "available",
	}
}

func performRequest(usecase fakeDownloadUseCase) *httptest.ResponseRecorder {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	RegisterRoutes(router, NewHandler(usecase))
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/downloads/android/latest", nil)
	router.ServeHTTP(response, request)
	return response
}

func TestDownloadLatestAndroidAPKSuccess(t *testing.T) {
	response := performRequest(fakeDownloadUseCase{
		result: domain.DownloadResult{
			Metadata: handlerMetadata(),
			Content:  []byte("abc"),
			SHA256:   handlerMetadata().SHA256,
		},
	})

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
	if response.Header().Get("Content-Type") != apkMediaType {
		t.Fatalf("unexpected content type %q", response.Header().Get("Content-Type"))
	}
	if response.Header().Get("Cache-Control") != cacheControl {
		t.Fatalf("expected no-store cache header")
	}
	if response.Header().Get("Content-Disposition") != `attachment; filename="BusIsComing.apk"` {
		t.Fatalf("unexpected content disposition %q", response.Header().Get("Content-Disposition"))
	}
	if response.Body.String() != "abc" {
		t.Fatalf("unexpected body %q", response.Body.String())
	}
}

func TestDownloadLatestAndroidAPKErrors(t *testing.T) {
	cases := []struct {
		name string
		err  error
		code int
		want string
	}{
		{
			name: "missing",
			err:  domain.NewDownloadError(domain.CodeAPKMissing, "missing"),
			code: http.StatusNotFound,
			want: string(domain.CodeAPKMissing),
		},
		{
			name: "checksum mismatch",
			err:  domain.NewDownloadError(domain.CodeAPKChecksumMismatch, "mismatch"),
			code: http.StatusConflict,
			want: string(domain.CodeAPKChecksumMismatch),
		},
		{
			name: "unreadable",
			err:  domain.NewDownloadError(domain.CodeAPKUnreadable, "unreadable"),
			code: http.StatusInternalServerError,
			want: string(domain.CodeAPKUnreadable),
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			response := performRequest(fakeDownloadUseCase{err: tc.err})
			if response.Code != tc.code {
				t.Fatalf("expected %d, got %d", tc.code, response.Code)
			}
			if response.Header().Get("Cache-Control") != cacheControl {
				t.Fatalf("expected no-store cache header")
			}

			var body errorResponse
			if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
				t.Fatalf("invalid JSON response: %v", err)
			}
			if body.Code != tc.want {
				t.Fatalf("expected code %s, got %s", tc.want, body.Code)
			}
		})
	}
}
