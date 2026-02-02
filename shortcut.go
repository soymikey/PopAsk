package main

import (
	"context"
	"encoding/json"
	"fmt"
	goRuntime "runtime"
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
	BaseService
	keyRecords   []string
	shortcutList []map[string]interface{}
	hookChan     chan hook.Event
	lastTrigger  map[string]time.Time // 记录每个快捷键的最后触发时间
}

// NewShortcutService 创建新的快捷键服务
func NewShortcutService(ctx context.Context, app *App) *ShortcutService {
	service := &ShortcutService{
		keyRecords:  []string{},
		lastTrigger: make(map[string]time.Time),
	}
	service.SetContext(ctx)
	service.SetApp(app)
	return service
}

// RegisterKeyboardShortcut 注册键盘快捷键
func (s *ShortcutService) RegisterKeyboardShortcut() {
	s.logSvc.Info("Registering keyboard shortcuts")

	// Clear existing hooks if any
	if s.hookChan != nil {
		s.logSvc.Info("Clearing existing keyboard hooks")
		hook.End()
		close(s.hookChan)
		s.hookChan = nil
		time.Sleep(100 * time.Millisecond) // 给一点时间让之前的hook完全清理
	}

	// Start new hook listener
	s.hookChan = make(chan hook.Event)
	seenShortcut := make(map[string]bool)
	var registeredList, skippedList []string
	for _, prompt := range s.shortcutList {
		shortcutStr, ok := prompt["shortcut"].(string)
		if !ok || shortcutStr == "" {
			continue
		}
		// Mac 上只监听 cmd，不监听 ctrl（大小写不敏感）
		if goRuntime.GOOS == "darwin" && strings.Contains(strings.ToLower(shortcutStr), "ctrl") {
			s.logSvc.Info("Skipping ctrl shortcut on macOS: %s", shortcutStr)
			skippedList = append(skippedList, shortcutStr)
			continue
		}
		if seenShortcut[shortcutStr] {
			s.logSvc.Info("Skipping duplicate shortcut: %s", shortcutStr)
			continue
		}
		seenShortcut[shortcutStr] = true
		valueStr, ok := prompt["value"].(string)
		if !ok {
			continue
		}
		parts := strings.Split(shortcutStr, "+")
		shortcut := make([]string, 0, len(parts))
		for _, p := range parts {
			if k := strings.TrimSpace(p); k != "" {
				shortcut = append(shortcut, k)
			}
		}
		if len(shortcut) == 0 {
			s.logSvc.Info("Skipping empty shortcut: %s", shortcutStr)
			continue
		}
		// Windows/Linux 无 Command 键，配置里的 cmd 映射为 ctrl
		if goRuntime.GOOS != "darwin" {
			for i, k := range shortcut {
				if strings.ToLower(k) == "cmd" {
					shortcut[i] = "ctrl"
				}
			}
		}
		s.logSvc.Info("Registering shortcut: %s -> hook keys: %v for action: %s", shortcutStr, shortcut, valueStr)
		registeredList = append(registeredList, shortcutStr)

		// 创建局部变量避免闭包问题（类型已校验）
		shortcutKey := shortcutStr
		promptValue := valueStr
		hook.Register(hook.KeyDown, shortcut, func(e hook.Event) {
			// 检查是否在3秒内已经触发过
			if lastTime, exists := s.lastTrigger[shortcutKey]; exists {
				if time.Since(lastTime) < 3*time.Second {
					s.logSvc.Info("Shortcut %s triggered too frequently, ignoring", shortcutKey)
					return
				}
			}

			// 更新最后触发时间
			s.lastTrigger[shortcutKey] = time.Now()

			s.logSvc.Info("Shortcut triggered: %s", shortcutKey)
			autoAsking := true
			text := ""
			err := error(nil)
			isOpenWindowShortcut := promptValue == "Open Window"
			isOrcShortcut := promptValue == "ORC"

			if isOpenWindowShortcut || isOrcShortcut {
				autoAsking = false
			}

			if isOrcShortcut {
				// isUserInChina := s.GetApp().IsUserInChina()
				// if isUserInChina {
				// 	s.logSvc.Error("OCR failed: some countries network are not supported")
				// 	runtime.MessageDialog(s.GetContext(), runtime.MessageDialogOptions{
				// 		Type:    runtime.ErrorDialog,
				// 		Title:   "OCR failed",
				// 		Message: "OCR failed: some countries network are not supported",
				// 	})
				// 	fmt.Println("OCR failed: some countries network are not supported")
				// 	return
				// }
				text, err = s.GetApp().CreateScreenshot(s.GetContext())
				if err != nil {
					s.logSvc.Error("Failed to create screenshot for OCR: %v", err)
					fmt.Printf("Error: %v\n", err)
					return
				}
			} else {
				text, err = s.GetApp().GetSelection(s.GetContext())
				if text == "" {
					time.Sleep(100 * time.Millisecond)
					text, err = s.GetApp().GetSelection(s.GetContext())
					if text == "" {
						time.Sleep(100 * time.Millisecond)
						text, err = s.GetApp().GetSelection(s.GetContext())
					}
				}
				if err != nil {
					s.logSvc.Error("Failed to get selection after retries: %v", err)
					fmt.Printf("Error getting selection after retries: %v\n", err)
					return
				}
			}

			s.logSvc.Info("Emitting GET_SELECTION event with text length: %d", len(text))
			runtime.EventsEmit(s.GetContext(), "GET_SELECTION", map[string]interface{}{
				"text":         text,
				"shortcut":     shortcutKey,
				"prompt":       promptValue,
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

	s.logSvc.Info("Shortcuts listened (registered): %v", registeredList)
	if len(skippedList) > 0 {
		s.logSvc.Info("Shortcuts skipped on macOS (ctrl): %v", skippedList)
	}
	s.logSvc.Info("Successfully registered %d keyboard shortcuts", len(registeredList))
	// Start processing in a goroutine to avoid blocking
	go func() {
		s := hook.Start()
		<-hook.Process(s)
	}()
}

// SetShortcutList 设置快捷键列表
func (s *ShortcutService) SetShortcutList(jsonData string) error {
	s.logSvc.Info("Setting shortcut list from JSON data")

	var shortcutItems []ShortcutItem
	err := json.Unmarshal([]byte(jsonData), &shortcutItems)
	if err != nil {
		s.logSvc.Error("Failed to unmarshal prompt list: %v", err)
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
	s.logSvc.Info("Successfully updated shortcut list with %d items", len(shortcutItems))
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
	// 使用已经初始化的服务实例
	a.shortcutSvc.RegisterKeyboardShortcut()
}

func (a *App) SetShortcutList(jsonData string) error {
	// 使用已经初始化的服务实例
	return a.shortcutSvc.SetShortcutList(jsonData)
}

func (a *App) addKeyRecord(record string) {
	// 使用已经初始化的服务实例
	a.shortcutSvc.addKeyRecord(record)
}
