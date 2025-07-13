package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	hook "github.com/robotn/gohook"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// ShortcutItem 快捷键项结构体
type ShortcutItem struct {
	Label    string `json:"label"`
	Value    string `json:"value"`
	Shortcut string `json:"shortcut"`
}

// RegisterKeyboardShortcut 注册键盘快捷键
func (a *App) RegisterKeyboardShortcut(ctx context.Context) {
	// Clear existing hooks if any
	if a.hookChan != nil {
		hook.End()
		close(a.hookChan)
		a.hookChan = nil
		time.Sleep(100 * time.Millisecond) // 给一点时间让之前的hook完全清理
	}

	// Start new hook listener
	a.hookChan = make(chan hook.Event)
	for _, prompt := range a.shortcutList {
		if prompt["shortcut"] == "" {
			continue
		}
		shortcut := strings.Split(prompt["shortcut"].(string), "+")
		println("RegisterKeyboardShortcut", prompt["shortcut"].(string))

		// 创建局部变量避免闭包问题
		currentPrompt := prompt
		hook.Register(hook.KeyDown, shortcut, func(e hook.Event) {
			println("Shortcut triggered:", currentPrompt["shortcut"].(string))
			autoAsking := true
			text := ""
			err := error(nil)
			isOpenWindowShortcut := currentPrompt["value"].(string) == "Open Window"
			isOrcShortcut := currentPrompt["value"].(string) == "ORC"

			if isOpenWindowShortcut || isOrcShortcut {
				autoAsking = false
			}

			if isOrcShortcut {
				isUserInChina := a.IsUserInChina()
				if isUserInChina {
					runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
						Type:    runtime.ErrorDialog,
						Title:   "OCR failed",
						Message: "OCR failed: some countries network are not supported",
					})
					fmt.Println("OCR failed: some countries network are not supported")
					return
				}
				text, err = a.CreateScreenshot(ctx)
				if err != nil {
					fmt.Printf("Error: %v\n", err)
					return
				}
			} else {
				text, err = a.GetSelection(ctx)
				if text == "" {
					time.Sleep(100 * time.Millisecond)
					text, err = a.GetSelection(ctx)
					if text == "" {
						time.Sleep(100 * time.Millisecond)
						text, err = a.GetSelection(ctx)
					}
				}
				if err != nil {
					fmt.Printf("Error getting selection after retries: %v\n", err)
					return
				}
			}

			runtime.EventsEmit(ctx, "GET_SELECTION", map[string]interface{}{
				"text":         text,
				"shortcut":     currentPrompt["shortcut"].(string),
				"prompt":       currentPrompt["value"].(string),
				"autoAsking":   autoAsking,
				"isOCR":        isOrcShortcut,
				"isOpenWindow": isOpenWindowShortcut,
			})
			println("Selected text:", text)
			fmt.Printf("Error: %v\n", err)

			// 阻止事件继续传播，防止无限触发
			e.Rawcode = 0
		})
	}

	// Start processing in a goroutine to avoid blocking
	go func() {
		s := hook.Start()
		<-hook.Process(s)
	}()
}

// SetShortcutList 设置快捷键列表
func (a *App) SetShortcutList(jsonData string) error {
	var shortcutItems []ShortcutItem
	err := json.Unmarshal([]byte(jsonData), &shortcutItems)
	if err != nil {
		return fmt.Errorf("failed to unmarshal prompt list: %v", err)
	}

	a.shortcutList = make([]map[string]interface{}, len(shortcutItems))
	for i, item := range shortcutItems {
		a.shortcutList[i] = map[string]interface{}{
			"label":    item.Label,
			"value":    item.Value,
			"shortcut": item.Shortcut,
		}
	}
	println("Prompt list updated with", len(shortcutItems), "items")
	return nil
}

// addKeyRecord 添加按键记录，维护最多3条记录的FIFO行为
func (a *App) addKeyRecord(record string) {
	println("addKeyRecord", record)
	// Check if the new record is the same as the last one
	if len(a.keyRecords) > 0 && a.keyRecords[len(a.keyRecords)-1] == record {
		return // Skip adding if it's the same as the last record
	}

	a.keyRecords = append(a.keyRecords, record)
	if len(a.keyRecords) > 3 {
		a.keyRecords = a.keyRecords[1:] // Remove the first (oldest) record
	}
}
