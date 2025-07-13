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

// ShortcutService 快捷键服务
type ShortcutService struct {
	ctx          context.Context
	keyRecords   []string
	shortcutList []map[string]interface{}
	hookChan     chan hook.Event
	app          *App // 引用App以访问其他服务
}

// NewShortcutService 创建新的快捷键服务
func NewShortcutService(ctx context.Context, app *App) *ShortcutService {
	return &ShortcutService{
		ctx:        ctx,
		keyRecords: []string{},
		app:        app,
	}
}

// RegisterKeyboardShortcut 注册键盘快捷键
func (s *ShortcutService) RegisterKeyboardShortcut() {
	// Clear existing hooks if any
	if s.hookChan != nil {
		hook.End()
		close(s.hookChan)
		s.hookChan = nil
		time.Sleep(100 * time.Millisecond) // 给一点时间让之前的hook完全清理
	}

	// Start new hook listener
	s.hookChan = make(chan hook.Event)
	for _, prompt := range s.shortcutList {
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
				isUserInChina := s.app.IsUserInChina()
				if isUserInChina {
					runtime.MessageDialog(s.ctx, runtime.MessageDialogOptions{
						Type:    runtime.ErrorDialog,
						Title:   "OCR failed",
						Message: "OCR failed: some countries network are not supported",
					})
					fmt.Println("OCR failed: some countries network are not supported")
					return
				}
				text, err = s.app.CreateScreenshot(s.ctx)
				if err != nil {
					fmt.Printf("Error: %v\n", err)
					return
				}
			} else {
				text, err = s.app.GetSelection(s.ctx)
				if text == "" {
					time.Sleep(100 * time.Millisecond)
					text, err = s.app.GetSelection(s.ctx)
					if text == "" {
						time.Sleep(100 * time.Millisecond)
						text, err = s.app.GetSelection(s.ctx)
					}
				}
				if err != nil {
					fmt.Printf("Error getting selection after retries: %v\n", err)
					return
				}
			}

			runtime.EventsEmit(s.ctx, "GET_SELECTION", map[string]interface{}{
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
func (s *ShortcutService) SetShortcutList(jsonData string) error {
	var shortcutItems []ShortcutItem
	err := json.Unmarshal([]byte(jsonData), &shortcutItems)
	if err != nil {
		return fmt.Errorf("failed to unmarshal prompt list: %v", err)
	}

	s.shortcutList = make([]map[string]interface{}, len(shortcutItems))
	for i, item := range shortcutItems {
		s.shortcutList[i] = map[string]interface{}{
			"label":    item.Label,
			"value":    item.Value,
			"shortcut": item.Shortcut,
		}
	}
	println("Prompt list updated with", len(shortcutItems), "items")
	return nil
}

// addKeyRecord 添加按键记录，维护最多3条记录的FIFO行为
func (s *ShortcutService) addKeyRecord(record string) {
	println("addKeyRecord", record)
	// Check if the new record is the same as the last one
	if len(s.keyRecords) > 0 && s.keyRecords[len(s.keyRecords)-1] == record {
		return // Skip adding if it's the same as the last record
	}

	s.keyRecords = append(s.keyRecords, record)
	if len(s.keyRecords) > 3 {
		s.keyRecords = s.keyRecords[1:] // Remove the first (oldest) record
	}
}

// 保持向后兼容的方法
func (a *App) RegisterKeyboardShortcut(ctx context.Context) {
	shortcutSvc := NewShortcutService(ctx, a)
	shortcutSvc.shortcutList = a.shortcutList
	shortcutSvc.RegisterKeyboardShortcut()
}

func (a *App) SetShortcutList(jsonData string) error {
	shortcutSvc := NewShortcutService(a.ctx, a)
	err := shortcutSvc.SetShortcutList(jsonData)
	if err == nil {
		a.shortcutList = shortcutSvc.shortcutList
	}
	return err
}

func (a *App) addKeyRecord(record string) {
	shortcutSvc := NewShortcutService(a.ctx, a)
	shortcutSvc.keyRecords = a.keyRecords
	shortcutSvc.addKeyRecord(record)
	a.keyRecords = shortcutSvc.keyRecords
}
