package main

import (
	"context"
	"net/http"
	"time"
)

// NetworkService 网络服务
type NetworkService struct {
	BaseService
	client *http.Client
}

// NewNetworkService 创建新的网络服务
func NewNetworkService(ctx context.Context, app *App) *NetworkService {
	service := &NetworkService{
		client: &http.Client{
			Timeout: 3 * time.Second,
		},
	}
	service.SetContext(ctx)
	service.SetApp(app)
	return service
}

// IsUserInChina 判断用户是否在中国
func (n *NetworkService) IsUserInChina() bool {
	return !n.CanAccessGoogle()
}

// CanAccessGoogle 检测是否可以访问Google
func (n *NetworkService) CanAccessGoogle() bool {
	// 尝试访问Google
	_, err := n.client.Get("https://www.google.com")
	return err == nil
}

// 保持向后兼容的方法
func (a *App) IsUserInChina() bool {
	networkSvc := NewNetworkService(a.ctx, a)
	return networkSvc.IsUserInChina()
}

func (a *App) CanAccessGoogle() bool {
	networkSvc := NewNetworkService(a.ctx, a)
	return networkSvc.CanAccessGoogle()
}
