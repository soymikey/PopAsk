package main

import (
	"fmt"

	"github.com/go-vgo/robotgo"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// GetMousePosition 获取鼠标位置
func (a *App) GetMousePosition() (interface{}, error) {
	x, y := robotgo.GetMousePos()
	return map[string]interface{}{"x": x, "y": y}, nil
}

// ShowPopWindow 显示弹出窗口
func (a *App) ShowPopWindow() {
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
		x, y, w, h := robotgo.GetDisplayBounds(i)
		println(fmt.Sprintf("Display %d:", i))
		println(fmt.Sprintf("  Position: (%d, %d)", x, y))
		println(fmt.Sprintf("  Size: %dx%d", w, h))
		println(fmt.Sprintf("  Is Mouse Inside: %v", mouseX >= x && mouseX < x+w && mouseY >= y && mouseY < y+h))
		println("-------------------")

		// 检查鼠标是否在当前屏幕内
		if mouseX >= x && mouseX < x+w && mouseY >= y && mouseY < y+h {
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
			if finalX+windowWidth > x+w {
				finalX = x + w - windowWidth
			}
			if finalY < y {
				finalY = y
			}
			if finalY+windowHeight > y+h {
				finalY = y + h - windowHeight
			}

			println(fmt.Sprintf("  Final Position: (%d, %d)", finalX, finalY))

			// 先隐藏窗口
			runtime.WindowHide(a.ctx)

			// 设置窗口位置和大小
			runtime.WindowSetSize(a.ctx, windowWidth, windowHeight)
			runtime.WindowSetPosition(a.ctx, finalX, finalY)

			// 强制窗口显示在正确的显示器上
			runtime.WindowShow(a.ctx)
			return
		}
	}
}
