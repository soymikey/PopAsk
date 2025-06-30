package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/go-vgo/robotgo"
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
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
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

// addKeyRecord adds a record to keyRecords, maintaining max 3 records with FIFO behavior
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

// domReady is called after front-end resources have been loaded
func (a *App) domReady(ctx context.Context) {
}

func (a *App) RegisterKeyboardShortcut(ctx context.Context) {
	// Clear existing hooks if any
	if a.hookChan != nil {
		hook.End()
		close(a.hookChan)
		a.hookChan = nil
	}

	// Start new hook listener
	a.hookChan = make(chan hook.Event)
	for _, prompt := range a.shortcutList {
		if prompt["shortcut"] == "" {
			continue
		}
		shortcut := strings.Split(prompt["shortcut"].(string), "+")
		println("RegisterKeyboardShortcut", prompt["shortcut"].(string))
		hook.Register(hook.KeyDown, shortcut, func(e hook.Event) {
			println("Shortcut triggered:", prompt["shortcut"].(string))
			autoAsking := true
			text := ""
			err := error(nil)
			isOpenWindowShortcut := prompt["value"].(string) == "Open Window"
			isOrcShortcut := prompt["value"].(string) == "ORC"

			if isOpenWindowShortcut || isOrcShortcut {
				autoAsking = false
			}

			if isOrcShortcut {
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
				"shortcut":     prompt["shortcut"].(string),
				"prompt":       prompt["value"].(string),
				"autoAsking":   autoAsking,
				"isOCR":        isOrcShortcut,
				"isOpenWindow": isOpenWindowShortcut,
			})
			println("Selected text:", text)
			fmt.Printf("Error: %v\n", err)

		})
	}
	// // Ctrl/Cmd + Shift + O
	// hook.Register(hook.KeyDown, []string{"ctrl", "shift", "o"}, func(e hook.Event) {
	// 	println("Ctrl/Cmd + Shift + O")
	// 	// 开始截图
	// 	base64Str, err := a.CreateScreenshot(ctx)
	// 	if err != nil {
	// 		fmt.Printf("Error: %v\n", err)
	// 		return
	// 	}
	// 	runtime.EventsEmit(ctx, "CREATE_SCREENSHOT", map[string]interface{}{
	// 		"text":       base64Str,
	// 		"shortcut":   "ctrl+shift+o",
	// 		"prompt":     "",
	// 		"autoAsking": false,
	// 	})
	// 	println("Screenshot created:")

	// })
	// // Ctrl/Cmd + Shift + S
	// hook.Register(hook.KeyDown, []string{"ctrl", "shift", "s"}, func(e hook.Event) {
	// 	println("Ctrl/Cmd + Shift + S")
	// 	text, err := a.GetSelection(ctx)
	// 	if err != nil {
	// 		fmt.Printf("Error: %v\n", err)
	// 		return
	// 	}
	// 	// //发送文本
	// 	// if len(text) == 0 {
	// 	// 	return
	// 	// }
	// 	println("Selected text:", text)
	// 	runtime.EventsEmit(ctx, "GET_SELECTION", map[string]interface{}{
	// 		"text":       text,
	// 		"shortcut":   "ctrl+shift+s",
	// 		"prompt":     "",
	// 		"autoAsking": false,
	// 	})
	// })
	// hook.Register(hook.KeyDown, []string{"ctrl", "shift", "1"}, func(e hook.Event) {
	// 	text, err := a.GetSelection(ctx)
	// 	if err != nil {
	// 		fmt.Printf("Error: %v\n", err)
	// 		return
	// 	}
	// 	runtime.EventsEmit(ctx, "GET_SELECTION", map[string]interface{}{"text": text, "key": "ctrl+shift+1", "prompt": "帮我翻译成中文:\n", "autoAsking": true})
	// 	println("Selected text:", text)

	// })

	// Start processing in a goroutine to avoid blocking
	go func() {
		s := hook.Start()
		<-hook.Process(s)
	}()
}

func (a *App) GetSelection(ctx context.Context) (string, error) {
	// 保存当前剪贴板内容
	originalText, err := runtime.ClipboardGetText(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get original clipboard text: %v", err)
	}
	if err := runtime.ClipboardSetText(ctx, ""); err != nil {
		return "", fmt.Errorf("failed to restore original clipboard text: %v", err)
	}

	// 模拟 Cmd+C
	cmd := exec.Command("osascript", "-e", "tell application \"System Events\" to keystroke \"c\" using command down")
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("failed to execute copy command: %v", err)
	}

	// 添加短暂延迟确保复制完成
	time.Sleep(300 * time.Millisecond)

	// 获取剪贴板内容
	text, err := runtime.ClipboardGetText(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get clipboard text: %v", err)
	}

	// 恢复原始剪贴板内容
	if err := runtime.ClipboardSetText(ctx, originalText); err != nil {
		return "", fmt.Errorf("failed to restore original clipboard text: %v", err)
	}

	return strings.TrimSpace(text), nil
}

func (a *App) CreateScreenshot(ctx context.Context) (string, error) {
	// 生成带时间戳的文件名
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("screenshot_%s.png", timestamp)

	cmd := exec.Command("screencapture", "-i", filename)

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("failed to execute screenshot command: %v", err)
	}

	// 读取图片文件并转换为base64
	imgData, err := os.ReadFile(filename)
	if err != nil {
		return "", fmt.Errorf("failed to read screenshot file: %v", err)
	}

	// 转换为base64
	base64Str := base64.StdEncoding.EncodeToString(imgData)

	// 添加标准base64前缀
	base64WithPrefix := "data:image/png;base64," + base64Str

	// 清理临时文件
	os.Remove(filename)

	return base64WithPrefix, nil
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
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

type APIResponse []interface{}

type Gist struct {
	Description string      `json:"description"`
	Public      bool        `json:"public"`
	Files       interface{} `json:"files"`
}

const BASE_URL = "https://api.github.com"
const SERVER_URL = "https://extension.migaox.com"

var githubResponse APIResponse

func (a *App) GetPublicRepositories() (APIResponse, error) {

	url := fmt.Sprintf("%s/repositories", BASE_URL)
	response, err := MakeGetRequest(url, "")

	if err != nil {
		return nil, err
	}

	json.Unmarshal(response, &githubResponse)

	return githubResponse, nil
}

func (a *App) GetPublicGists() (APIResponse, error) {

	url := fmt.Sprintf("%s/gists/public", BASE_URL)
	response, err := MakeGetRequest(url, "")

	if err != nil {
		return nil, err
	}

	json.Unmarshal(response, &githubResponse)

	return githubResponse, nil
}

func (a *App) GetRepositoriesForAuthenticatedUser(token string) (APIResponse, error) {

	url := fmt.Sprintf("%s/user/repos?type=private", BASE_URL)
	response, err := MakeGetRequest(url, token)

	if err != nil {
		return nil, err
	}

	json.Unmarshal(response, &githubResponse)

	return githubResponse, nil
}

func (a *App) GetGistsForAuthenticatedUser(token string) (APIResponse, error) {

	url := fmt.Sprintf("%s/gists", BASE_URL)
	response, err := MakeGetRequest(url, token)

	if err != nil {
		return nil, err
	}

	json.Unmarshal(response, &githubResponse)

	return githubResponse, nil
}

func (a *App) GetMoreInformationFromURL(url, token string) (APIResponse, error) {

	response, err := MakeGetRequest(url, token)

	if err != nil {
		return nil, err
	}

	json.Unmarshal(response, &githubResponse)

	return githubResponse, nil
}

func (a *App) GetGistContent(url, token string) (string, error) {

	githubResponse, err := MakeGetRequest(url, token)

	if err != nil {
		return "", err
	}

	return string(githubResponse), nil
}

func (a *App) CreateNewGist(gist Gist, token string) (interface{}, error) {

	var githubResponse interface{}

	requestBody, _ := json.Marshal(gist)
	url := fmt.Sprintf("%s/gists", BASE_URL)
	response, err := MakePostRequest(url, token, requestBody)

	if err != nil {
		return nil, err
	}

	json.Unmarshal(response, &githubResponse)

	return githubResponse, nil
}

type ChatRequest struct {
	Message string `json:"message"`
}

type ChatResponse struct {
	Code int         `json:"code"`
	Data interface{} `json:"data"`
}

func (a *App) ChatAPI(message string) (ChatResponse, error) {
	var chatResponse ChatResponse

	requestBody, _ := json.Marshal(ChatRequest{Message: message})
	url := fmt.Sprintf("%s/ai-translator/openai", SERVER_URL)
	response, err := MakePostRequest(url, "", requestBody)

	if err != nil {
		return ChatResponse{}, err
	}

	json.Unmarshal(response, &chatResponse)

	return chatResponse, nil
}

func (a *App) GetMousePosition() (interface{}, error) {
	x, y := robotgo.GetMousePos()
	return map[string]interface{}{"x": x, "y": y}, nil
}

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

type ShortcutItem struct {
	Label    string `json:"label"`
	Value    string `json:"value"`
	Shortcut string `json:"shortcut"`
}

// SetShortcutList sets the prompt list from frontend JSON string
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
