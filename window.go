package main

import (
	"context"
	"fmt"

	"github.com/go-vgo/robotgo"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// WindowService 窗口服务
type WindowService struct {
	ctx context.Context
}

// NewWindowService 创建新的窗口服务
func NewWindowService(ctx context.Context) *WindowService {
	return &WindowService{ctx: ctx}
}

// GetMousePosition 获取鼠标位置
func (w *WindowService) GetMousePosition() (interface{}, error) {
	x, y := robotgo.GetMousePos()
	return map[string]interface{}{"x": x, "y": y}, nil
}

// ShowPopWindow 显示弹出窗口
func (w *WindowService) ShowPopWindow() {
	// 获取鼠标位置
	mouseX, mouseY := robotgo.Location()
	println("Mouse Position:", mouseX, mouseY)

	// 获取屏幕数量
	num := robotgo.DisplaysNum()
	println("\nTotal Displays:", num)

	// 获取所有屏幕信息
	println("\nDisplay Information:")
	println("-------------------")
	for i := 0; i < num; i++ {
		x, y, width, height := robotgo.GetDisplayBounds(i)
		println(fmt.Sprintf("Display %d:", i))
		println(fmt.Sprintf("  Position: (%d, %d)", x, y))
		println(fmt.Sprintf("  Size: %dx%d", width, height))
		println(fmt.Sprintf("  Is Mouse Inside: %v", mouseX >= x && mouseX < x+width && mouseY >= y && mouseY < y+height))
		println("-------------------")

		// 检查鼠标是否在当前屏幕内
		if mouseX >= x && mouseX < x+width && mouseY >= y && mouseY < y+height {
			println(fmt.Sprintf("\nSelected Display: %d", i))

			// 窗口尺寸
			windowWidth := 100
			windowHeight := 100

			// 在鼠标右上方显示
			finalX := mouseX
			finalY := mouseY

			println("\nWindow Position Calculation:")
			println(fmt.Sprintf("  Initial Position: (%d, %d)", finalX, finalY))

			// 确保窗口在当前屏幕范围内
			if finalX < x {
				finalX = x
			}
			if finalX+windowWidth > x+width {
				finalX = x + width - windowWidth
			}
			if finalY < y {
				finalY = y
			}
			if finalY+windowHeight > y+height {
				finalY = y + height - windowHeight
			}

			println(fmt.Sprintf("  Final Position: (%d, %d)", finalX, finalY))

			// 先隐藏窗口
			runtime.WindowHide(w.ctx)

			// 设置窗口位置和大小
			runtime.WindowSetSize(w.ctx, windowWidth, windowHeight)
			runtime.WindowSetPosition(w.ctx, finalX, finalY)

			// 强制窗口显示在正确的显示器上
			runtime.WindowShow(w.ctx)
			return
		}
	}
}

// 保持向后兼容的方法
func (a *App) GetMousePosition() (interface{}, error) {
	windowSvc := NewWindowService(a.ctx)
	return windowSvc.GetMousePosition()
}

func (a *App) ShowPopWindow() {
	windowSvc := NewWindowService(a.ctx)
	windowSvc.ShowPopWindow()
}
