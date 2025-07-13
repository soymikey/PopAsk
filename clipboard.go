package main

import (
	"context"
	"fmt"
	"os/exec"
	goRuntime "runtime"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// ClipboardService 剪贴板服务
type ClipboardService struct {
	ctx context.Context
}

// NewClipboardService 创建新的剪贴板服务
func NewClipboardService(ctx context.Context) *ClipboardService {
	return &ClipboardService{ctx: ctx}
}

// simulateCopy 模拟复制操作，根据操作系统选择不同的实现
func (c *ClipboardService) simulateCopy() error {
	if goRuntime.GOOS == "windows" {
		// 使用 PowerShell 直接操作剪贴板，避免模拟按键
		cmd := exec.Command("powershell", "-Command", `
			Add-Type -AssemblyName System.Windows.Forms
			[System.Windows.Forms.SendKeys]::SendWait("^c")
		`)
		return cmd.Run()
	} else if goRuntime.GOOS == "darwin" {
		var cmd *exec.Cmd
		cmd = exec.Command("osascript", "-e", `tell application "System Events" to keystroke "c" using command down`)
		return cmd.Run()
	}
	// 其他平台...
	return nil
}

// GetSelection 获取选中的文本
func (c *ClipboardService) GetSelection() (string, error) {
	// 保存当前剪贴板内容
	originalText, err := runtime.ClipboardGetText(c.ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get original clipboard text: %v", err)
	}
	if err := runtime.ClipboardSetText(c.ctx, ""); err != nil {
		return "", fmt.Errorf("failed to restore original clipboard text: %v", err)
	}

	// 根据操作系统选择不同的复制命令
	err = c.simulateCopy()
	if err != nil {
		return "", fmt.Errorf("failed to simulate copy: %v", err)
	}

	// 添加短暂延迟确保复制完成
	time.Sleep(300 * time.Millisecond)

	// 获取剪贴板内容
	text, err := runtime.ClipboardGetText(c.ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get clipboard text: %v", err)
	}

	// 恢复原始剪贴板内容
	if err := runtime.ClipboardSetText(c.ctx, originalText); err != nil {
		return "", fmt.Errorf("failed to restore original clipboard text: %v", err)
	}

	return strings.TrimSpace(text), nil
}

// 保持向后兼容的方法
func (a *App) simulateCopy() error {
	clipboardSvc := NewClipboardService(a.ctx)
	return clipboardSvc.simulateCopy()
}

func (a *App) GetSelection(ctx context.Context) (string, error) {
	clipboardSvc := NewClipboardService(ctx)
	return clipboardSvc.GetSelection()
}
