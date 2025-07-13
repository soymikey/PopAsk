package main

import (
	"context"
	"fmt"

	hook "github.com/robotn/gohook"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const COMMAND_KEY_CODE = 3675
const SPACE_KEY_CODE = 57

// App struct
type App struct {
	ctx             context.Context
	keyRecords      []string
	shortcutList    []map[string]interface{}
	systemShortcuts []map[string]interface{}
	hookChan        chan hook.Event
	hardware        *Hardware
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	a.hardware = NewHardware()
	// Perform your setup here
	a.ctx = ctx
	a.keyRecords = []string{}
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
