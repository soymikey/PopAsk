//go:build !windows
// +build !windows

package main

// SendShiftWinS 发送 Shift+Win+S 快捷键 (非 Windows 平台)
func SendShiftWinS() {
	// 非 Windows 平台，不做任何操作
}

// SendShiftWinSAlternative 使用 keybd_event 的替代方案 (非 Windows 平台)
func SendShiftWinSAlternative() {
	// 非 Windows 平台，不做任何操作
}

// HasClipboardImage 检查剪贴板是否有图片格式 (非 Windows 平台)
func HasClipboardImage() bool {
	// 非 Windows 平台，返回 false
	return false
}
