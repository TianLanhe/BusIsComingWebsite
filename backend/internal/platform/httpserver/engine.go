package httpserver

import (
	"io"

	"github.com/gin-gonic/gin"
)

func NewPublicEngine(output io.Writer, analytics gin.HandlerFunc) *gin.Engine {
	engine := gin.New()
	safeOutput := &synchronizedWriter{writer: output}
	engine.Use(RequestLogger(safeOutput))
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
