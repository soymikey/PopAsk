package backend

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/go-vgo/robotgo"
)

type ScreenshotService struct {
	ctx *App
}

func NewScreenshotService(ctx *App) *ScreenshotService {
	return &ScreenshotService{
		ctx: ctx,
	}
}

func (s *ScreenshotService) CaptureScreen() (string, error) {
	// 获取屏幕截图
	bitmap := robotgo.CaptureScreen()
	if bitmap == nil {
		return "", fmt.Errorf("failed to capture screen")
	}

	// 创建临时文件
	tempDir := os.TempDir()
	filename := fmt.Sprintf("screenshot_%d.png", time.Now().UnixNano())
	filepath := filepath.Join(tempDir, filename)

	// 保存为PNG文件
	err := robotgo.SaveBitmap(bitmap, filepath)
	if err != nil {
		return "", fmt.Errorf("failed to save screenshot: %v", err)
	}

	// 读取文件内容
	fileData, err := os.ReadFile(filepath)
	if err != nil {
		return "", fmt.Errorf("failed to read screenshot file: %v", err)
	}

	// 转换为base64
	base64Str := base64.StdEncoding.EncodeToString(fileData)

	// 添加标准base64前缀
	base64WithPrefix := "data:image/png;base64," + base64Str

	// 清理临时文件
	os.Remove(filepath)

	return base64WithPrefix, nil
}
