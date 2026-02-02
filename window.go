package main

import (
	"context"

	"github.com/go-vgo/robotgo"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// WindowService 窗口服务
type WindowService struct {
	BaseService
}

// NewWindowService 创建新的窗口服务
func NewWindowService(ctx context.Context, app *App) *WindowService {
	service := &WindowService{}
	service.SetContext(ctx)
	service.SetApp(app)
	return service
}

// GetMousePosition 获取鼠标位置
func (w *WindowService) GetMousePosition() (interface{}, error) {
	x, y := robotgo.GetMousePos()
	return map[string]interface{}{"x": x, "y": y}, nil
}

const popWindowWidth = 100
const popWindowHeight = 100

func clampPositionToDisplay(mouseX, mouseY, displayX, displayY, displayW, displayH int) (x, y int) {
	x, y = mouseX, mouseY
	if x < displayX {
		x = displayX
	}
	if x+popWindowWidth > displayX+displayW {
		x = displayX + displayW - popWindowWidth
	}
	if y < displayY {
		y = displayY
	}
	if y+popWindowHeight > displayY+displayH {
		y = displayY + displayH - popWindowHeight
	}
	return x, y
}

func (w *WindowService) ShowPopWindow() {
	mouseX, mouseY := robotgo.Location()
	num := robotgo.DisplaysNum()
	for i := 0; i < num; i++ {
		x, y, width, height := robotgo.GetDisplayBounds(i)
		if mouseX >= x && mouseX < x+width && mouseY >= y && mouseY < y+height {
			finalX, finalY := clampPositionToDisplay(mouseX, mouseY, x, y, width, height)
			runtime.WindowHide(w.ctx)
			runtime.WindowSetSize(w.ctx, popWindowWidth, popWindowHeight)
			runtime.WindowSetPosition(w.ctx, finalX, finalY)
			runtime.WindowShow(w.ctx)
			return
		}
	}
}

func (a *App) GetMousePosition() (interface{}, error) {
	return a.windowSvc.GetMousePosition()
}

func (a *App) ShowPopWindow() {
	a.windowSvc.ShowPopWindow()
}
