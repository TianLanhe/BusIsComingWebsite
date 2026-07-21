package http

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// RegisterStaticFallback is intentionally registered only on the private engine.
// Every response is no-store so a tunneled maintenance browser never keeps a stale
// Dashboard shell across deployments.
func RegisterStaticFallback(engine *gin.Engine, root string) {
	cleanRoot := filepath.Clean(root)
	engine.NoRoute(func(c *gin.Context) {
		c.Header("Cache-Control", "no-store")
		if strings.HasPrefix(c.Request.URL.Path, "/api/") || root == "" {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"code": "not_found", "message": "资源不存在"})
			return
		}
		relative := strings.TrimPrefix(filepath.Clean(c.Request.URL.Path), string(filepath.Separator))
		candidate := filepath.Join(cleanRoot, relative)
		if relative != "." && withinRoot(cleanRoot, candidate) {
			if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
				c.File(candidate)
				return
			}
		}
		index := filepath.Join(cleanRoot, "index.html")
		if _, err := os.Stat(index); err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"code": "not_found", "message": "监控页面未构建"})
			return
		}
		c.File(index)
	})
}

func withinRoot(root, candidate string) bool {
	relative, err := filepath.Rel(root, candidate)
	return err == nil && relative != ".." && !strings.HasPrefix(relative, ".."+string(filepath.Separator))
}
