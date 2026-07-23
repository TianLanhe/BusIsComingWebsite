package httpserver

import (
	"io"

	"github.com/gin-gonic/gin"
)

func NewPublicEngine(output io.Writer, analytics gin.HandlerFunc) *gin.Engine {
	engine := gin.New()
	safeOutput := &synchronizedWriter{writer: output}
	engine.Use(RequestLogger(safeOutput))
	// 外层 recovery 覆盖 analytics 本身；内层 recovery 先处理业务 handler，
	// 让 analytics 能在 c.Next() 返回后把受控的 500 记录为失败事件。
	engine.Use(Recovery(safeOutput))
	if analytics != nil {
		engine.Use(analytics)
	}
	engine.Use(Recovery(safeOutput))
	return engine
}

func NewPrivateEngine(output io.Writer) *gin.Engine {
	engine := gin.New()
	safeOutput := &synchronizedWriter{writer: output}
	engine.Use(RequestLogger(safeOutput), Recovery(safeOutput))
	return engine
}
