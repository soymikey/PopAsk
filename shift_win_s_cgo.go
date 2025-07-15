//go:build windows
// +build windows

package main

/*
#cgo CFLAGS: -g -Wall
#cgo LDFLAGS: -luser32
#include <windows.h>
#include <stdint.h>

void sendShiftWinS() {
    INPUT inputs[4] = {0};

    // Press Shift
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = VK_SHIFT;

    // Press Windows key
    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = VK_LWIN;

    // Press S
    inputs[2].type = INPUT_KEYBOARD;
    inputs[2].ki.wVk = 'S';

    // Release all keys (in reverse order)
    inputs[3].type = INPUT_KEYBOARD;
    inputs[3].ki.wVk = 'S';
    inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;

    INPUT releaseInputs[2] = {0};
    releaseInputs[0].type = INPUT_KEYBOARD;
    releaseInputs[0].ki.wVk = VK_LWIN;
    releaseInputs[0].ki.dwFlags = KEYEVENTF_KEYUP;

    releaseInputs[1].type = INPUT_KEYBOARD;
    releaseInputs[1].ki.wVk = VK_SHIFT;
    releaseInputs[1].ki.dwFlags = KEYEVENTF_KEYUP;

    SendInput(4, inputs, sizeof(INPUT));
    Sleep(100);
    SendInput(2, releaseInputs, sizeof(INPUT));
}

// 检查剪贴板是否有图片格式
int hasClipboardImage() {
    return IsClipboardFormatAvailable(CF_BITMAP) ||
           IsClipboardFormatAvailable(CF_DIB) ||
           IsClipboardFormatAvailable(CF_DIBV5);
}
*/
import "C"

// SendShiftWinS 发送 Shift+Win+S 快捷键
func SendShiftWinS() {
	C.sendShiftWinS()
}

// HasClipboardImage 检查剪贴板是否有图片格式
func HasClipboardImage() bool {
	return C.hasClipboardImage() != 0
}
