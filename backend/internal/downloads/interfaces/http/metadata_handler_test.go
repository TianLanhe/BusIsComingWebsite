package downloadhttp

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"busiscoming-website/backend/internal/downloads/application"
	"busiscoming-website/backend/internal/downloads/domain"
	"github.com/gin-gonic/gin"
)

type fakeMetadataUseCase struct {
	result application.LatestAPKMetadata
	err    error
}

func (usecase fakeMetadataUseCase) Execute(context.Context) (application.LatestAPKMetadata, error) {
	return usecase.result, usecase.err
}

func performMetadataRequest(usecase fakeMetadataUseCase) *httptest.ResponseRecorder {
	testingMode()
	router := gin.New()
	RegisterRoutes(router, NewHandler(fakeDownloadUseCase{}, usecase))
	response := httptest.NewRecorder()
	router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/downloads/android/latest/metadata", nil))
	return response
}

func testingMode() { gin.SetMode(gin.TestMode) }

func TestLatestAPKMetadataSuccessUsesWhitelistAndNoStore(t *testing.T) {
	response := performMetadataRequest(fakeMetadataUseCase{result: application.LatestAPKMetadata{
		Platform: "android", Status: "available", VersionName: "1.0", VersionCode: 1,
		FileName: "BusIsComing.apk", SizeBytes: 5563930, LastUpdated: "2026-07-07",
		DownloadURL: "/api/downloads/android/latest",
	}})
	if response.Code != http.StatusOK || response.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("unexpected response status=%d headers=%v", response.Code, response.Header())
	}
	var body map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	for _, field := range []string{"platform", "status", "versionName", "versionCode", "fileName", "sizeBytes", "lastUpdated", "downloadUrl"} {
		if _, ok := body[field]; !ok {
			t.Fatalf("missing public field %s in %v", field, body)
		}
	}
	for _, forbidden := range []string{"sourcePath", "relativePath", "sha256", "applicationId"} {
		if _, ok := body[forbidden]; ok {
			t.Fatalf("response leaked %s", forbidden)
		}
	}
}

func TestLatestAPKMetadataMapsControlledErrors(t *testing.T) {
	cases := []struct {
		code   domain.ErrorCode
		status int
	}{
		{domain.CodeAPKMetadataMissing, http.StatusNotFound},
		{domain.CodeAPKMetadataUnreadable, http.StatusInternalServerError},
		{domain.CodeAPKMetadataInvalid, http.StatusInternalServerError},
		{domain.CodeDownloadInternal, http.StatusInternalServerError},
	}
	for _, tc := range cases {
		t.Run(string(tc.code), func(t *testing.T) {
			response := performMetadataRequest(fakeMetadataUseCase{err: domain.NewDownloadError(tc.code, "private details")})
			if response.Code != tc.status || response.Header().Get("Cache-Control") != "no-store" {
				t.Fatalf("unexpected response status=%d headers=%v", response.Code, response.Header())
			}
			if !strings.Contains(response.Body.String(), string(tc.code)) || strings.Contains(response.Body.String(), "private details") {
				t.Fatalf("expected controlled Chinese error without internal details, got %s", response.Body.String())
			}
		})
	}
}

func TestMetadataFailureDoesNotChangeDownloadRoute(t *testing.T) {
	testingMode()
	router := gin.New()
	handler := NewHandler(fakeDownloadUseCase{result: domain.DownloadResult{
		Metadata: handlerMetadata(), Content: []byte("abc"), SHA256: handlerMetadata().SHA256,
	}}, fakeMetadataUseCase{err: domain.NewDownloadError(domain.CodeAPKMetadataInvalid, "invalid")})
	RegisterRoutes(router, handler)

	metadataResponse := httptest.NewRecorder()
	router.ServeHTTP(metadataResponse, httptest.NewRequest(http.MethodGet, "/api/downloads/android/latest/metadata", nil))
	downloadResponse := httptest.NewRecorder()
	router.ServeHTTP(downloadResponse, httptest.NewRequest(http.MethodGet, "/api/downloads/android/latest", nil))
	if metadataResponse.Code != http.StatusInternalServerError || downloadResponse.Code != http.StatusOK || downloadResponse.Body.String() != "abc" {
		t.Fatalf("metadata failure must not affect download: metadata=%d download=%d", metadataResponse.Code, downloadResponse.Code)
	}
}
