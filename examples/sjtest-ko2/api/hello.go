package api

import (
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Hello(c *gin.Context) {
	c.JSON(http.StatusOK, "Hello New User Updated 22222")
}

func HelloJson(c *gin.Context) {
	//check body
	body := c.Request.Body
	value, err := ioutil.ReadAll(body)
	if err != nil {
		fmt.Println(err.Error())
	}
	fmt.Println(string(value))

	c.JSON(http.StatusOK, "HelloJson Ok")
}

type PostData struct {
	Query string `form:"query" json:"query"`
}

func HelloPost(c *gin.Context) {
	var d PostData
	if err := c.Bind(&d); err != nil {
		fmt.Println(err.Error())
	}
	fmt.Println(d.Query)

	c.JSON(http.StatusOK, "HelloPost Ok")
}
