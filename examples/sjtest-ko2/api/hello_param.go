package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Param struct {
	Name string `form:"name" json:"name" binding:"required"`
	Age  int    `form:"age" json:"age" binding:"required"`
}

// test cmd
// $ curl -v -X POST http://localhost:8080/helloparam -H 'content-type:applicaton/json' -d '{"name": "who", "age":111}'
func ParamJson(c *gin.Context) {
	var json Param
	if err := c.ShouldBindJSON(&json); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

// test cmd : curl -v -X GET "http://localhost:8080/helloquery?name=aaa&age=111"
// test url : http://localhost:8080/helloquery?name=aaa&age=111
func ParamQuery(c *gin.Context) {
	var json Param
	if err := c.ShouldBindQuery(&json); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}
