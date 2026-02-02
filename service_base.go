package main

import (
	"context"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	goRuntime "runtime"
	"strings"
	"time"
)

// ServiceBase 服务基础接口
type ServiceBase interface {
	SetContext(ctx context.Context)
	SetApp(app *App)
	GetContext() context.Context
	GetApp() *App
	IsWindows() bool
	IsMacOS() bool
	IsLinux() bool
	GetOS() string
}

// BaseService 基础服务结构
type BaseService struct {
	ctx    context.Context
	app    *App
	logSvc *LogService
}

// SetContext 设置上下文
func (b *BaseService) SetContext(ctx context.Context) {
	b.ctx = ctx
}

// SetApp 设置应用实例
func (b *BaseService) SetApp(app *App) {
	b.app = app
	if app != nil {
		b.logSvc = app.logSvc
	}
}

// GetContext 获取上下文
func (b *BaseService) GetContext() context.Context {
	return b.ctx
}

// GetApp 获取应用实例
func (b *BaseService) GetApp() *App {
	return b.app
}

// IsWindows 判断是否为Windows系统
func (b *BaseService) IsWindows() bool {
	return goRuntime.GOOS == "windows"
}

// IsMacOS 判断是否为macOS系统
func (b *BaseService) IsMacOS() bool {
	return goRuntime.GOOS == "darwin"
}

// IsLinux 判断是否为Linux系统
func (b *BaseService) IsLinux() bool {
	return goRuntime.GOOS == "linux"
}

// GetOS 获取操作系统名称
func (b *BaseService) GetOS() string {
	return goRuntime.GOOS
}

func (b *BaseService) GetLogService() *LogService {
	return b.logSvc
}

// EnvOrDefault 返回 os.Getenv(key)，为空时返回 def。
func (b *BaseService) EnvOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func (b *BaseService) IsDevelopment() bool {
	envChecks := []struct {
		key string
		val string
	}{
		{"WAILS_ENV", "development"},
		{"WAILS_BUILD_MODE", "development"},
		{"DEBUG", "true"},
	}
	for _, c := range envChecks {
		if os.Getenv(c.key) == c.val {
			return true
		}
	}
	if env := os.Getenv("GO_ENV"); env == "development" || env == "dev" {
		return true
	}
	if _, err := os.Stat("go.mod"); err == nil {
		if _, err := os.Stat("wails.json"); err == nil {
			return true
		}
	}
	execPath, err := os.Executable()
	if err == nil {
		name := filepath.Base(execPath)
		if (name == "main" || name == "popask") {
			if _, err := os.Stat(filepath.Join(filepath.Dir(execPath), "go.mod")); err == nil {
				return true
			}
		}
	}
	return false
}

// ExecuteCommand 执行系统命令并返回输出
func (b *BaseService) ExecuteCommand(name string, args ...string) (string, error) {
	cmd := exec.Command(name, args...)
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(output)), nil
}

// ExecuteCommandWithError 执行系统命令并返回输出和错误
func (b *BaseService) ExecuteCommandWithError(name string, args ...string) (string, error) {
	cmd := exec.Command(name, args...)
	output, err := cmd.CombinedOutput()
	return strings.TrimSpace(string(output)), err
}

// FormatTime 格式化时间戳
func (b *BaseService) FormatTime(format string) string {
	return time.Now().Format(format)
}

// FormatDateTime 格式化日期时间 (2006-01-02 15:04:05)
func (b *BaseService) FormatDateTime() string {
	return time.Now().Format("2006-01-02 15:04:05")
}

// FormatDate 格式化日期 (2006-01-02)
func (b *BaseService) FormatDate() string {
	return time.Now().Format("2006-01-02")
}

// FormatTimestamp 格式化时间戳 (20060102_150405)
func (b *BaseService) FormatTimestamp() string {
	return time.Now().Format("20060102_150405")
}

// CreateTempFile 创建临时文件
func (b *BaseService) CreateTempFile(prefix, suffix string) (*os.File, error) {
	return os.CreateTemp("", prefix+"_*"+suffix)
}

// EnsureDirectory 确保目录存在，不存在则创建
func (b *BaseService) EnsureDirectory(dir string) error {
	return os.MkdirAll(dir, 0755)
}

// FileExists 检查文件是否存在
func (b *BaseService) FileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// JoinPath 连接路径
func (b *BaseService) JoinPath(elem ...string) string {
	return filepath.Join(elem...)
}

// GetExecutableDir 获取可执行文件所在目录
func (b *BaseService) GetExecutableDir() (string, error) {
	execPath, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Dir(execPath), nil
}

// GetExecutableName 获取可执行文件名
func (b *BaseService) GetExecutableName() (string, error) {
	execPath, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Base(execPath), nil
}

// CanAccessURL 检测是否可以访问指定URL
func (b *BaseService) CanAccessURL(url string, timeout time.Duration) bool {
	client := &http.Client{
		Timeout: timeout,
	}
	_, err := client.Get(url)
	return err == nil
}

// CanAccessGoogle 检测是否可以访问Google
func (b *BaseService) CanAccessGoogle() bool {
	return b.CanAccessURL("https://www.google.com", 3*time.Second)
}

// IsUserInChina 判断用户是否在中国（基于Google访问性）
func (b *BaseService) IsUserInChina() bool {
	return !b.CanAccessGoogle()
}
