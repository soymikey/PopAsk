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

// simulateCopy 模拟复制操作，根据操作系统选择不同的实现
func (a *App) simulateCopy() error {
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
func (a *App) GetSelection(ctx context.Context) (string, error) {
	// 保存当前剪贴板内容
	originalText, err := runtime.ClipboardGetText(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get original clipboard text: %v", err)
	}
	if err := runtime.ClipboardSetText(ctx, ""); err != nil {
		return "", fmt.Errorf("failed to restore original clipboard text: %v", err)
	}

	// 根据操作系统选择不同的复制命令
	err = a.simulateCopy()
	if err != nil {
		return "", fmt.Errorf("failed to simulate copy: %v", err)
	}

	// 添加短暂延迟确保复制完成
	time.Sleep(300 * time.Millisecond)

	// 获取剪贴板内容
	text, err := runtime.ClipboardGetText(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get clipboard text: %v", err)
	}

	// 恢复原始剪贴板内容
	if err := runtime.ClipboardSetText(ctx, originalText); err != nil {
		return "", fmt.Errorf("failed to restore original clipboard text: %v", err)
	}

	return strings.TrimSpace(text), nil
}
