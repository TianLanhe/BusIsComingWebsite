package domain

type ErrorCode string

const (
	CodeAPKMissing          ErrorCode = "APK_MISSING"
	CodeAPKUnreadable       ErrorCode = "APK_UNREADABLE"
	CodeAPKChecksumMismatch ErrorCode = "APK_CHECKSUM_MISMATCH"
	CodeDownloadInternal    ErrorCode = "DOWNLOAD_INTERNAL_ERROR"
)

type DownloadError struct {
	Code              ErrorCode
	Message           string
	ExpectedSHA256    *string
	ActualSHA256      *string
	ExpectedSizeBytes *int64
	ActualSizeBytes   *int64
}

func (err *DownloadError) Error() string {
	if err == nil {
		return ""
	}
	return string(err.Code) + ": " + err.Message
}

type DownloadResult struct {
	Metadata CurrentAPK
	Content  []byte
	SHA256   string
}

func NewDownloadError(code ErrorCode, message string) *DownloadError {
	return &DownloadError{Code: code, Message: message}
}

func StringPtr(value string) *string {
	return &value
}

func Int64Ptr(value int64) *int64 {
	return &value
}
