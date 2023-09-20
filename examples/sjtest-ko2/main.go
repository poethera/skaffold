package main

import (
	"gintest/api"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	//cors
	r.Use(cors.Default())

	r.GET("/hello", api.Hello)
	r.GET("/hellojson", api.HelloJson)
	r.POST("/hellojson2", api.HelloJson)
	r.POST("hellopost", api.HelloPost)

	r.POST("/chunked_test", api.ChunkedTest)
	r.POST("/chunked_json", api.ChunkedResJson)
	r.POST("/chunked_text", api.ChunkedResText)
	r.POST("/chunked_async", api.ChunkedResAsync)

	s := &http.Server{
		Addr:    "127.0.0.1:8080",
		Handler: r,
	}
	s.ListenAndServe()
}
