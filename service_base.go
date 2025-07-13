package main

import (
	"context"
	goRuntime "runtime"
)

// ServiceBase 服务基础接口
type ServiceBase interface {
	SetContext(ctx context.Context)
	SetApp(app *App)
	GetContext() context.Context
	GetApp() *App
	IsWindows() bool
	IsMacOS() bool
	IsLinux() bool
	GetOS() string
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

// IsWindows 判断是否为Windows系统
func (b *BaseService) IsWindows() bool {
	return goRuntime.GOOS == "windows"
}

// IsMacOS 判断是否为macOS系统
func (b *BaseService) IsMacOS() bool {
	return goRuntime.GOOS == "darwin"
}

// IsLinux 判断是否为Linux系统
func (b *BaseService) IsLinux() bool {
	return goRuntime.GOOS == "linux"
}

// GetOS 获取操作系统名称
func (b *BaseService) GetOS() string {
	return goRuntime.GOOS
}
