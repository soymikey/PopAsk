//go:build !windows
// +build !windows

package main

import "fmt"

// SendCtrlC 非 Windows 平台的存根实现
func SendCtrlC() error {
	return fmt.Errorf("SendCtrlC not implemented on this platform")
}
