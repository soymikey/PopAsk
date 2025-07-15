//go:build windows
// +build windows

package main

/*
#cgo CFLAGS: -I. -g -Wall
#cgo LDFLAGS: -L. -luser32
#include <windows.h>
#include <winuser.h>
#include <stdint.h>
void sendCtrlC() {
    INPUT inputs[2] = {0};
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = VK_CONTROL;
    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = 0x43; // 'C' key
    SendInput(2, inputs, sizeof(INPUT));

    Sleep(50);

    inputs[0].ki.dwFlags = KEYEVENTF_KEYUP;
    inputs[1].ki.dwFlags = KEYEVENTF_KEYUP;
    SendInput(2, inputs, sizeof(INPUT));
}

// 检查剪贴板是否有图片格式
int hasClipboardImage() {
    return IsClipboardFormatAvailable(CF_BITMAP) ||
           IsClipboardFormatAvailable(CF_DIB) ||
           IsClipboardFormatAvailable(CF_DIBV5);
}
*/
import "C"

// SendCtrlC 使用 Windows API 发送 Ctrl+C
func SendCtrlC() {
	C.sendCtrlC()
}

// SendShiftWinSAlternative 使用 keybd_event 的替代方案
func SendShiftWinS() {
	// 使用 keybd_event 可能更可靠
	C.keybd_event(C.VK_SHIFT, 0, 0, 0)
	C.keybd_event(C.VK_LWIN, 0, 0, 0)
	C.keybd_event('S', 0, 0, 0)
	C.keybd_event('S', 0, C.KEYEVENTF_KEYUP, 0)
	C.keybd_event(C.VK_LWIN, 0, C.KEYEVENTF_KEYUP, 0)
	C.keybd_event(C.VK_SHIFT, 0, C.KEYEVENTF_KEYUP, 0)
}

// HasClipboardImage 检查剪贴板是否有图片格式
func HasClipboardImage() bool {
	return C.hasClipboardImage() != 0
}
