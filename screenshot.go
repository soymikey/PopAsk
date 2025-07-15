package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.design/x/clipboard"
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
	s.logSvc.Info("Creating Windows screenshot using Shift+Win+S")

	// 清空剪贴板，确保检测到新图片
	runtime.ClipboardSetText(s.ctx, "")
	time.Sleep(100 * time.Millisecond)

	// 使用 CGO 发送 Shift+Win+S 快捷键
	s.logSvc.Info("Sending Shift+Win+S shortcut using alternative method...")
	SendShiftWinSAlternative()

	// 等待截图工具启动
	time.Sleep(300 * time.Millisecond)

	// 使用更智能的检测方法
	var imgData []byte
	var err error
	maxWaitTime := 30 * time.Second // 最多等待30秒
	checkInterval := 200 * time.Millisecond
	startTime := time.Now()

	for time.Since(startTime) < maxWaitTime {
		// 首先检查 Windows 剪贴板格式
		if HasClipboardImage() {
			// 剪贴板有图片格式，尝试读取
			imgData, err = s.getClipboardImage()
			if err == nil && len(imgData) > 0 {
				s.logSvc.Info("Successfully captured Windows screenshot, size: %d bytes", len(imgData))
				break
			}
		}

		time.Sleep(checkInterval)
	}

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
	// 使用 golang.design/x/clipboard 获取剪贴板图片
	imgData := clipboard.Read(clipboard.FmtImage)
	if len(imgData) == 0 {
		return nil, fmt.Errorf("no image found in clipboard")
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
