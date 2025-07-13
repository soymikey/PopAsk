package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-vgo/robotgo"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// ScreenshotService 截图服务
type ScreenshotService struct {
	BaseService
}

// NewScreenshotService 创建新的截图服务
func NewScreenshotService(ctx context.Context, app *App) *ScreenshotService {
	service := &ScreenshotService{}
	service.SetContext(ctx)
	service.SetApp(app)
	return service
}

// CreateScreenshot 创建截图，根据操作系统选择不同的实现
func (s *ScreenshotService) CreateScreenshot() (string, error) {
	s.logSvc.Info("Creating screenshot, OS: %s", s.GetOS())
	if s.IsWindows() {
		return s.CreateScreenshotWindows()
	} else {
		return s.CreateScreenshotMac()
	}
}

// CreateScreenshotWindows Windows系统截图实现
func (s *ScreenshotService) CreateScreenshotWindows() (string, error) {
	s.logSvc.Info("Creating Windows screenshot using snipping tool")

	var cmd *exec.Cmd

	cmd = exec.Command("snippingtool.exe")
	if err := cmd.Start(); err != nil {
		s.logSvc.Error("Failed to start snipping tool: %v", err)
		return "", fmt.Errorf("failed to start snipping tool: %v", err)
	}

	// 等待工具启动并自动进入截图模式
	time.Sleep(1000 * time.Millisecond)
	robotgo.KeyTap("enter")
	// 轮询检查剪贴板是否有图片，最多等待10秒
	var imgData []byte
	var err error
	maxAttempts := 5
	for i := 0; i < maxAttempts; i++ {
		time.Sleep(500 * time.Millisecond)
		imgData, err = s.getClipboardImage()
		if err == nil && len(imgData) > 0 {
			// 强制关闭截图工具
			exec.Command("taskkill", "/IM", "snippingtool.exe", "/F").Run()
			// 清理剪贴板
			runtime.ClipboardSetText(s.ctx, "")
			s.logSvc.Info("Successfully captured Windows screenshot, size: %d bytes", len(imgData))
			break
		}
		// 检查 snippingtool.exe 是否还在运行
		out, _ := exec.Command("tasklist", "/FI", "IMAGENAME eq snippingtool.exe").Output()
		if !strings.Contains(strings.ToLower(string(out)), "snippingtool.exe") {
			s.logSvc.Info("Snipping tool process has ended")
			println("snippingtool.exe 已关闭")
			break
		}
	}
	exec.Command("taskkill", "/IM", "snippingtool.exe", "/F").Run()
	if len(imgData) == 0 {
		s.logSvc.Error("Screenshot timeout or cancelled by user")
		return "", fmt.Errorf("screenshot timeout or cancelled by user")
	}

	// 转换为base64
	base64Str := base64.StdEncoding.EncodeToString(imgData)
	return "data:image/png;base64," + base64Str, nil
}

// CreateScreenshotMac macOS系统截图实现
func (s *ScreenshotService) CreateScreenshotMac() (string, error) {
	s.logSvc.Info("Creating macOS screenshot using screencapture")

	// 生成带时间戳的文件名
	timestamp := time.Now().Format("20060102_150405")
	tempDir := os.TempDir()
	filename := filepath.Join(tempDir, fmt.Sprintf("PopAsk_Screenshot_%s.png", timestamp))
	s.logSvc.Info("Screenshot filename: %s", filename)
	println("filename", filename)
	var cmd *exec.Cmd

	// macOS: 使用screencapture
	cmd = exec.Command("screencapture", "-i", filename)
	if err := cmd.Run(); err != nil {
		s.logSvc.Error("Failed to execute screenshot command: %v", err)
		return "", fmt.Errorf("failed to execute screenshot command: %v", err)
	}

	// 读取图片文件并转换为base64
	imgData, err := os.ReadFile(filename)
	if err != nil {
		s.logSvc.Error("Failed to read screenshot file: %v", err)
		return "", fmt.Errorf("failed to read screenshot file: %v", err)
	}

	// 转换为base64
	base64Str := base64.StdEncoding.EncodeToString(imgData)
	base64WithPrefix := "data:image/png;base64," + base64Str

	// 清理临时文件
	os.Remove(filename)
	s.logSvc.Info("Successfully captured macOS screenshot, size: %d bytes", len(imgData))

	return base64WithPrefix, nil
}

// getClipboardImage 获取剪贴板中的图片数据
func (s *ScreenshotService) getClipboardImage() ([]byte, error) {
	// 使用PowerShell获取剪贴板图片
	cmd := exec.Command("powershell", "-Command", `
		Add-Type -AssemblyName System.Windows.Forms
		$clipboard = [System.Windows.Forms.Clipboard]::GetImage()
		if ($clipboard) {
			$stream = New-Object System.IO.MemoryStream
			$clipboard.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
			$bytes = $stream.ToArray()
			$stream.Close()
			[System.Convert]::ToBase64String($bytes)
		} else {
			""
		}
	`)

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get clipboard image: %v", err)
	}

	// 移除输出中的换行符
	base64Str := strings.TrimSpace(string(output))
	if base64Str == "" {
		return nil, fmt.Errorf("no image found in clipboard")
	}

	// 解码base64
	imgData, err := base64.StdEncoding.DecodeString(base64Str)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base64 image: %v", err)
	}

	return imgData, nil
}

// 保持向后兼容的方法
func (a *App) CreateScreenshot(ctx context.Context) (string, error) {
	screenshotSvc := NewScreenshotService(ctx, a)
	return screenshotSvc.CreateScreenshot()
}

func (a *App) CreateScreenshotWindows(ctx context.Context) (string, error) {
	screenshotSvc := NewScreenshotService(ctx, a)
	return screenshotSvc.CreateScreenshotWindows()
}

func (a *App) CreateScreenshotMac(ctx context.Context) (string, error) {
	screenshotSvc := NewScreenshotService(ctx, a)
	return screenshotSvc.CreateScreenshotMac()
}
