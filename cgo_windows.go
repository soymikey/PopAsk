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

void sendShiftWinS() {
    INPUT inputs[6] = {0};

    // Press Shift
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = VK_SHIFT;

    // Press Windows key
    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = VK_LWIN;

    // Press S
    inputs[2].type = INPUT_KEYBOARD;
    inputs[2].ki.wVk = 'S';

    // Release S
    inputs[3].type = INPUT_KEYBOARD;
    inputs[3].ki.wVk = 'S';
    inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;

    // Release Windows key
    inputs[4].type = INPUT_KEYBOARD;
    inputs[4].ki.wVk = VK_LWIN;
    inputs[4].ki.dwFlags = KEYEVENTF_KEYUP;

    // Release Shift
    inputs[5].type = INPUT_KEYBOARD;
    inputs[5].ki.wVk = VK_SHIFT;
    inputs[5].ki.dwFlags = KEYEVENTF_KEYUP;

    // Send all inputs at once
    SendInput(6, inputs, sizeof(INPUT));
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

// SendShiftWinS 发送 Shift+Win+S 快捷键
func SendShiftWinS() {
	C.sendShiftWinS()
}

// SendShiftWinSAlternative 使用 keybd_event 的替代方案
func SendShiftWinSAlternative() {
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
