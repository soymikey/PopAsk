package main

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// ClipboardService 剪贴板服务
type ClipboardService struct {
	BaseService
}

// NewClipboardService 创建新的剪贴板服务
func NewClipboardService(ctx context.Context, app *App) *ClipboardService {
	service := &ClipboardService{}
	service.SetContext(ctx)
	service.SetApp(app)
	return service
}

// simulateCopy 模拟复制操作，根据操作系统选择不同的实现
func (c *ClipboardService) simulateCopy() error {
	if c.IsWindows() {
		// 使用 Windows API 直接发送 Ctrl+C，完全避免窗口显示
		return SendCtrlC()
	} else if c.IsMacOS() {
		var cmd *exec.Cmd
		cmd = exec.Command("osascript", "-e", `tell application "System Events" to keystroke "c" using command down`)
		return cmd.Run()
	}
	// 其他平台...
	return nil
}

// GetSelection 获取选中的文本
func (c *ClipboardService) GetSelection() (string, error) {
	c.logSvc.Info("Getting text selection from clipboard")

	// 保存当前剪贴板内容
	originalText, err := runtime.ClipboardGetText(c.ctx)
	if err != nil {
		c.logSvc.Error("Failed to get original clipboard text: %v", err)
		return "", fmt.Errorf("failed to get original clipboard text: %v", err)
	}
	if err := runtime.ClipboardSetText(c.ctx, ""); err != nil {
		c.logSvc.Error("Failed to clear clipboard: %v", err)
		return "", fmt.Errorf("failed to restore original clipboard text: %v", err)
	}

	// 根据操作系统选择不同的复制命令
	err = c.simulateCopy()
	if err != nil {
		c.logSvc.Error("Failed to simulate copy: %v", err)
		return "", fmt.Errorf("failed to simulate copy: %v", err)
	}

	// 添加短暂延迟确保复制完成
	time.Sleep(300 * time.Millisecond)

	// 获取剪贴板内容
	text, err := runtime.ClipboardGetText(c.ctx)
	if err != nil {
		c.logSvc.Error("Failed to get clipboard text: %v", err)
		return "", fmt.Errorf("failed to get clipboard text: %v", err)
	}

	// 恢复原始剪贴板内容
	if err := runtime.ClipboardSetText(c.ctx, originalText); err != nil {
		c.logSvc.Error("Failed to restore original clipboard text: %v", err)
		return "", fmt.Errorf("failed to restore original clipboard text: %v", err)
	}

	trimmedText := strings.TrimSpace(text)
	c.logSvc.Info("Successfully got text selection, length: %d", len(trimmedText))
	return trimmedText, nil
}

// 保持向后兼容的方法
func (a *App) simulateCopy() error {
	clipboardSvc := NewClipboardService(a.ctx, a)
	return clipboardSvc.simulateCopy()
}

func (a *App) GetSelection(ctx context.Context) (string, error) {
	clipboardSvc := NewClipboardService(ctx, a)
	return clipboardSvc.GetSelection()
}
