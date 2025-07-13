package main

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const COMMAND_KEY_CODE = 3675
const SPACE_KEY_CODE = 57

// App struct
type App struct {
	ctx         context.Context
	hardwareSvc *HardwareService
	// 服务字段
	screenshotSvc *ScreenshotService
	promptSvc     *PromptService
	clipboardSvc  *ClipboardService
	shortcutSvc   *ShortcutService
	apiSvc        *APIService
	windowSvc     *WindowService
	networkSvc    *NetworkService
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	a.hardwareSvc = NewHardwareService()
	// 初始化服务
	a.screenshotSvc = NewScreenshotService(ctx)
	a.promptSvc = NewPromptService()
	a.clipboardSvc = NewClipboardService(ctx)
	a.shortcutSvc = NewShortcutService(ctx, a)
	a.apiSvc = NewAPIService()
	a.windowSvc = NewWindowService(ctx)
	a.networkSvc = NewNetworkService()

	// Perform your setup here
	a.ctx = ctx
	runtime.EventsOn(ctx, "syncShortcutList", func(data ...interface{}) {
		if len(data) > 0 {
			a.SetShortcutList(data[0].(string))
			a.RegisterKeyboardShortcut(ctx)
		}
	})
}

// domReady is called after front-end resources have been loaded
func (a *App) domReady(ctx context.Context) {
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	// 隐藏窗口而不是关闭应用
	// runtime.WindowHide(ctx)
	// return true // 阻止窗口关闭
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
