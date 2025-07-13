package main

import (
	"net/http"
	"time"
)

// IsUserInChina 判断用户是否在中国
func (a *App) IsUserInChina() bool {
	return !a.CanAccessGoogle()
}

// CanAccessGoogle 检测是否可以访问Google
func (a *App) CanAccessGoogle() bool {
	client := &http.Client{
		Timeout: 3 * time.Second,
	}

	// 尝试访问Google
	_, err := client.Get("https://www.google.com")
	return err == nil
}
