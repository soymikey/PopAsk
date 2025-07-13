package main

import (
	"context"
)

// ServiceBase 服务基础接口
type ServiceBase interface {
	SetContext(ctx context.Context)
	SetApp(app *App)
	GetContext() context.Context
	GetApp() *App
}

// BaseService 基础服务结构
type BaseService struct {
	ctx context.Context
	app *App
}

// SetContext 设置上下文
func (b *BaseService) SetContext(ctx context.Context) {
	b.ctx = ctx
}

// SetApp 设置应用实例
func (b *BaseService) SetApp(app *App) {
	b.app = app
}

// GetContext 获取上下文
func (b *BaseService) GetContext() context.Context {
	return b.ctx
}

// GetApp 获取应用实例
func (b *BaseService) GetApp() *App {
	return b.app
}
