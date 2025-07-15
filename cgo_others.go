//go:build !windows
// +build !windows

package main

import "fmt"

// SendCtrlC 非 Windows 平台的存根实现
func SendCtrlC() error {
	return fmt.Errorf("SendCtrlC not implemented on this platform")
}

// SendShiftWinS 发送 Shift+Win+S 快捷键 (非 Windows 平台)
func SendShiftWinS() {
	// 非 Windows 平台，不做任何操作
}

// SendShiftWinSAlternative 发送 Shift+Win+S 快捷键 (非 Windows 平台)
func SendShiftWinSAlternative() {
	// 非 Windows 平台，不做任何操作
}

// HasClipboardImage 检查剪贴板是否有图片格式 (非 Windows 平台)
func HasClipboardImage() bool {
	// 非 Windows 平台，返回 false
	return false
}
