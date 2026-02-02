package main

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const COMMAND_KEY_CODE = 3675
const SPACE_KEY_CODE = 57

type App struct {
	ctx           context.Context
	hardwareSvc   *HardwareService
	screenshotSvc *ScreenshotService
	promptSvc     *PromptService
	clipboardSvc  *ClipboardService
	shortcutSvc   *ShortcutService
	apiSvc        *APIService
	windowSvc     *WindowService
	networkSvc    *NetworkService
	logSvc        *LogService
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		logSvc: NewLogService(),
	}
}

func (a *App) initServices(ctx context.Context) {
	a.ctx = ctx
	a.hardwareSvc = NewHardwareService(ctx, a)
	a.screenshotSvc = NewScreenshotService(ctx, a)
	a.promptSvc = NewPromptService(ctx, a)
	a.clipboardSvc = NewClipboardService(ctx, a)
	a.shortcutSvc = NewShortcutService(ctx, a)
	a.apiSvc = NewAPIService(ctx, a)
	a.windowSvc = NewWindowService(ctx, a)
	a.networkSvc = NewNetworkService(ctx, a)
}

func (a *App) registerSyncShortcutList(ctx context.Context) {
	runtime.EventsOn(ctx, "syncShortcutList", func(data ...interface{}) {
		if len(data) > 0 {
			if s, ok := data[0].(string); ok {
				a.logSvc.Info("Received syncShortcutList event")
				_ = a.SetShortcutList(s)
				a.RegisterKeyboardShortcut(ctx)
			}
		}
	})
}

func (a *App) startup(ctx context.Context) {
	a.logSvc.Info("Starting PopAsk application")
	a.initServices(ctx)
	a.logSvc.Info("All services initialized successfully")
	a.registerSyncShortcutList(ctx)
	a.logSvc.Info("PopAsk application startup completed")
}

// domReady is called after front-end resources have been loaded
func (a *App) domReady(ctx context.Context) {
}

func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	a.logSvc.Info("Shutting down PopAsk application")

	// 关闭日志文件
	if err := a.logSvc.Close(); err != nil {
		fmt.Printf("Failed to close log file: %v\n", err)
	}

	a.logSvc.Info("PopAsk application shutdown completed")
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
