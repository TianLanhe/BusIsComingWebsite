package httpserver

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

func Recovery(output io.Writer) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if recover() == nil {
				return
			}
			stackDigest := sha256.Sum256(debug.Stack())
			writeJSON(output, map[string]any{
				"event":     "panic_recovered",
				"requestId": RequestID(c),
				"panicType": "panic",
				"stackHash": hex.EncodeToString(stackDigest[:8]),
			})
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"code":    "internal_error",
				"message": "服务暂时不可用",
			})
		}()
		c.Next()
	}
}
