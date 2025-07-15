//go:build windows
// +build windows

package main

/*
#cgo CFLAGS: -I.
#cgo LDFLAGS: -L. -luser32
#include <windows.h>
#include <winuser.h>
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
*/
import "C"

// SendCtrlC 使用 Windows API 发送 Ctrl+C
func SendCtrlC() {
	C.sendCtrlC()
}
