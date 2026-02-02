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

const shortcutThrottleDuration = 3 * time.Second
const shortcutHookCleanupDelay = 100 * time.Millisecond
const selectionRetryDelay = 100 * time.Millisecond
const selectionMaxAttempts = 3

func isModifierSkippedOnMac(shortcutStr string) bool {
	return goRuntime.GOOS == "darwin" && strings.Contains(strings.ToLower(shortcutStr), "ctrl")
}

func parseShortcutFromPrompt(prompt map[string]interface{}) (hookKeys []string, shortcutStr, valueStr string, ok bool) {
	shortcutStr, ok = prompt["shortcut"].(string)
	if !ok || shortcutStr == "" {
		return nil, "", "", false
	}
	valueStr, ok = prompt["value"].(string)
	if !ok {
		return nil, "", "", false
	}
	parts := strings.Split(shortcutStr, "+")
	hookKeys = make([]string, 0, len(parts))
	for _, p := range parts {
		if k := strings.TrimSpace(p); k != "" {
			hookKeys = append(hookKeys, k)
		}
	}
	if len(hookKeys) == 0 {
		return nil, shortcutStr, valueStr, false
	}
	if goRuntime.GOOS != "darwin" {
		for i, k := range hookKeys {
			if strings.ToLower(k) == "cmd" {
				hookKeys[i] = "ctrl"
			}
		}
	}
	return hookKeys, shortcutStr, valueStr, true
}

func (s *ShortcutService) getSelectionWithRetry() (string, error) {
	var text string
	var err error
	for attempt := 0; attempt < selectionMaxAttempts; attempt++ {
		if attempt > 0 {
			time.Sleep(selectionRetryDelay)
		}
		text, err = s.GetApp().GetSelection(s.GetContext())
		if text != "" || err != nil {
			return text, err
		}
	}
	return text, err
}

func (s *ShortcutService) runShortcutCallback(shortcutKey, promptValue string, e hook.Event) {
	if lastTime, exists := s.lastTrigger[shortcutKey]; exists && time.Since(lastTime) < shortcutThrottleDuration {
		s.logSvc.Info("Shortcut %s triggered too frequently, ignoring", shortcutKey)
		return
	}
	s.lastTrigger[shortcutKey] = time.Now()
	s.logSvc.Info("Shortcut triggered: %s", shortcutKey)

	isOpenWindowShortcut := promptValue == "Open Window"
	isOCRShortcut := promptValue == "OCR"
	autoAsking := !(isOpenWindowShortcut || isOCRShortcut)

	if isOpenWindowShortcut {
		s.emitGetSelection(shortcutKey, promptValue, "", autoAsking, false, true)
		e.Rawcode = 0
		return
	}

	var text string
	var err error
	if isOCRShortcut {
		text, err = s.GetApp().CreateScreenshot(s.GetContext())
		if err != nil {
			s.logSvc.Error("Failed to create screenshot for OCR: %v", err)
			return
		}
	} else {
		text, err = s.getSelectionWithRetry()
		if err != nil {
			s.logSvc.Error("Failed to get selection after retries: %v", err)
			return
		}
	}

	s.emitGetSelection(shortcutKey, promptValue, text, autoAsking, isOCRShortcut, isOpenWindowShortcut)
	e.Rawcode = 0
}

func (s *ShortcutService) emitGetSelection(shortcutKey, promptValue, text string, autoAsking, isOCR, isOpenWindow bool) {
	s.logSvc.Info("Emitting GET_SELECTION event with text length: %d", len(text))
	runtime.EventsEmit(s.GetContext(), "GET_SELECTION", map[string]interface{}{
		"text":         text,
		"shortcut":     shortcutKey,
		"prompt":       promptValue,
		"autoAsking":   autoAsking,
		"isOCR":        isOCR,
		"isOpenWindow": isOpenWindow,
	})
}

// RegisterKeyboardShortcut 注册键盘快捷键
func (s *ShortcutService) RegisterKeyboardShortcut() {
	s.logSvc.Info("Registering keyboard shortcuts")

	if s.hookChan != nil {
		s.logSvc.Info("Clearing existing keyboard hooks")
		hook.End()
		close(s.hookChan)
		s.hookChan = nil
		time.Sleep(shortcutHookCleanupDelay)
	}

	s.hookChan = make(chan hook.Event)
	seenShortcut := make(map[string]bool)
	var registeredList, skippedList []string

	for _, prompt := range s.shortcutList {
		hookKeys, shortcutStr, valueStr, ok := parseShortcutFromPrompt(prompt)
		if !ok {
			continue
		}
		if isModifierSkippedOnMac(shortcutStr) {
			s.logSvc.Info("Skipping ctrl shortcut on macOS: %s", shortcutStr)
			skippedList = append(skippedList, shortcutStr)
			continue
		}
		if seenShortcut[shortcutStr] {
			s.logSvc.Info("Skipping duplicate shortcut: %s", shortcutStr)
			continue
		}
		seenShortcut[shortcutStr] = true

		s.logSvc.Info("Registering shortcut: %s -> hook keys: %v for action: %s", shortcutStr, hookKeys, valueStr)
		registeredList = append(registeredList, shortcutStr)

		shortcutKey := shortcutStr
		promptValue := valueStr
		hook.Register(hook.KeyDown, hookKeys, func(e hook.Event) {
			s.runShortcutCallback(shortcutKey, promptValue, e)
		})
	}

	s.logSvc.Info("Shortcuts listened (registered): %v", registeredList)
	if len(skippedList) > 0 {
		s.logSvc.Info("Shortcuts skipped on macOS (ctrl): %v", skippedList)
	}
	s.logSvc.Info("Successfully registered %d keyboard shortcuts", len(registeredList))

	go func() {
		ev := hook.Start()
		<-hook.Process(ev)
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
	return nil
}

// addKeyRecord 添加按键记录，维护最多3条记录的FIFO行为
func (s *ShortcutService) addKeyRecord(record string) {
	s.logSvc.Info("addKeyRecord: %s", record)
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
