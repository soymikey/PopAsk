package main

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"os/exec"
	"runtime"
	"strings"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
)

// HardwareInfo 硬件信息结构
type HardwareInfo struct {
	CPUInfo     string `json:"cpu_info"`
	CPUCount    int    `json:"cpu_count"`
	Hostname    string `json:"hostname"`
	Platform    string `json:"platform"`
	OS          string `json:"os"`
	MemoryTotal uint64 `json:"memory_total"`
	MachineID   string `json:"machine_id"`
	MACAddress  string `json:"mac_address"`
	DiskSerial  string `json:"disk_serial"`
}

func NewHardwareInfo() *HardwareInfo {
	return &HardwareInfo{}
}

// GetHardwareFingerprint 获取硬件指纹
func (a *HardwareInfo) GetHardwareFingerprint() (*HardwareInfo, error) {
	info := &HardwareInfo{}

	// 获取CPU信息
	cpuInfo, err := cpu.Info()
	if err == nil && len(cpuInfo) > 0 {
		info.CPUInfo = cpuInfo[0].ModelName
		info.CPUCount = len(cpuInfo)
	}

	// 获取主机信息
	hostInfo, err := host.Info()
	if err == nil {
		info.Hostname = hostInfo.Hostname
		info.Platform = hostInfo.Platform
		info.OS = hostInfo.OS
		info.MachineID = hostInfo.HostID
	}

	// 获取内存信息
	memInfo, err := mem.VirtualMemory()
	if err == nil {
		info.MemoryTotal = memInfo.Total
	}

	// 获取MAC地址
	info.MACAddress = a.getMACAddress()

	// 获取磁盘序列号
	info.DiskSerial = a.getDiskSerial()

	return info, nil
}

// GetUniqueHardwareID 获取唯一硬件ID
func (a *HardwareInfo) GetUniqueHardwareID() (string, error) {
	info, err := a.GetHardwareFingerprint()
	if err != nil {
		return "", err
	}

	// 组合硬件信息生成唯一ID
	hardwareString := fmt.Sprintf("%s-%s-%s-%s-%d-%s-%s",
		info.CPUInfo,
		info.Hostname,
		info.MachineID,
		info.MACAddress,
		info.MemoryTotal,
		info.DiskSerial,
		runtime.GOOS,
	)

	// 生成MD5哈希
	hash := md5.Sum([]byte(hardwareString))
	return hex.EncodeToString(hash[:]), nil
}

// getMACAddress 获取MAC地址
func (a *HardwareInfo) getMACAddress() string {
	switch runtime.GOOS {
	case "darwin":
		return a.getMacOSMACAddress()
	case "windows":
		return a.getWindowsMACAddress()
	case "linux":
		return a.getLinuxMACAddress()
	default:
		return ""
	}
}

// getMacOSMACAddress 获取macOS的MAC地址
func (a *HardwareInfo) getMacOSMACAddress() string {
	cmd := exec.Command("ifconfig")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "ether") {
			parts := strings.Fields(line)
			for i, part := range parts {
				if part == "ether" && i+1 < len(parts) {
					return parts[i+1]
				}
			}
		}
	}
	return ""
}

// getWindowsMACAddress 获取Windows的MAC地址
func (a *HardwareInfo) getWindowsMACAddress() string {
	cmd := exec.Command("getmac", "/fo", "csv", "/nh")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, ",") {
			parts := strings.Split(line, ",")
			if len(parts) >= 2 {
				mac := strings.Trim(parts[1], "\"")
				if len(mac) > 0 {
					return mac
				}
			}
		}
	}
	return ""
}

// getLinuxMACAddress 获取Linux的MAC地址
func (a *HardwareInfo) getLinuxMACAddress() string {
	cmd := exec.Command("ip", "link", "show")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "link/ether") {
			parts := strings.Fields(line)
			for i, part := range parts {
				if part == "link/ether" && i+1 < len(parts) {
					return parts[i+1]
				}
			}
		}
	}
	return ""
}

// getDiskSerial 获取磁盘序列号
func (a *HardwareInfo) getDiskSerial() string {
	switch runtime.GOOS {
	case "darwin":
		return a.getMacOSDiskSerial()
	case "windows":
		return a.getWindowsDiskSerial()
	case "linux":
		return a.getLinuxDiskSerial()
	default:
		return ""
	}
}

// getMacOSDiskSerial 获取macOS磁盘序列号
func (a *HardwareInfo) getMacOSDiskSerial() string {
	cmd := exec.Command("diskutil", "info", "/")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "Volume UUID:") {
			parts := strings.Split(line, ":")
			if len(parts) >= 2 {
				return strings.TrimSpace(parts[1])
			}
		}
	}
	return ""
}

// getWindowsDiskSerial 获取Windows磁盘序列号
func (a *HardwareInfo) getWindowsDiskSerial() string {
	cmd := exec.Command("wmic", "diskdrive", "get", "serialnumber")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" && line != "SerialNumber" {
			return line
		}
	}
	return ""
}

// getLinuxDiskSerial 获取Linux磁盘序列号
func (a *HardwareInfo) getLinuxDiskSerial() string {
	cmd := exec.Command("lsblk", "-no", "UUID", "/")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}

	return strings.TrimSpace(string(output))
}

// ValidateHardwareID 验证硬件ID是否有效
func (a *HardwareInfo) ValidateHardwareID(hardwareID string) bool {
	// 检查硬件ID格式
	if len(hardwareID) != 32 {
		return false
	}

	// 检查是否只包含十六进制字符
	for _, char := range hardwareID {
		if !((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F')) {
			return false
		}
	}

	return true
}

// GetOS 获取当前操作系统
func (a *HardwareInfo) GetOS() string {
	return runtime.GOOS
}

// IsMacOS 判断是否为 macOS
func (a *HardwareInfo) IsMacOS() bool {
	return a.GetOS() == "darwin"
}

// IsWindows 判断是否为 Windows
func (a *HardwareInfo) IsWindows() bool {
	return a.GetOS() == "windows"
}

// IsLinux 判断是否为 Linux
func (a *HardwareInfo) IsLinux() bool {
	return a.GetOS() == "linux"
}
