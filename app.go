package main

import (
	"context"
	"embed"
	"encoding/base64"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-vgo/robotgo"
	hook "github.com/robotn/gohook"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed data/prompts.csv
var csvData embed.FS

// Prompt 结构体用于存储提示词数据
type Prompt struct {
	Act     string `json:"act"`
	Prompt  string `json:"prompt"`
	ForDevs string `json:"for_devs"`
}

const COMMAND_KEY_CODE = 3675
const SPACE_KEY_CODE = 57

// App struct
type App struct {
	ctx             context.Context
	keyRecords      []string
	shortcutList    []map[string]interface{}
	systemShortcuts []map[string]interface{}
	hookChan        chan hook.Event
	hardwareInfo    *HardwareInfo
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	a.hardwareInfo = NewHardwareInfo()
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

// IsUserInChina 判断用户是否在中国
func (a *App) IsUserInChina() bool {
	return !a.CanAccessGoogle()
}

func (a *App) CanAccessGoogle() bool {
	client := &http.Client{
		Timeout: 3 * time.Second,
	}

	// 尝试访问Google
	_, err := client.Get("https://www.google.com")
	return err == nil
}

func (a *App) IsMac() bool {
	return a.hardwareInfo.IsMacOS()
}

func (a *App) GetUniqueHardwareID() (string, error) {
	return a.hardwareInfo.GetUniqueHardwareID()
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

func (a *App) simulateCopy() error {
	if a.hardwareInfo.IsWindows() {
		// 使用 PowerShell 直接操作剪贴板，避免模拟按键
		cmd := exec.Command("powershell", "-Command", `
			Add-Type -AssemblyName System.Windows.Forms
			[System.Windows.Forms.SendKeys]::SendWait("^c")
		`)
		return cmd.Run()
	} else if a.hardwareInfo.IsMacOS() {
		var cmd *exec.Cmd
		cmd = exec.Command("osascript", "-e", `tell application "System Events" to keystroke "c" using command down`)
		return cmd.Run()
	}
	// 其他平台...
	return nil
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

	// 根据操作系统选择不同的复制命令
	err = a.simulateCopy()
	if err != nil {
		return "", fmt.Errorf("failed to simulate copy: %v", err)
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

	if a.hardwareInfo.IsWindows() {
		return a.CreateScreenshotWindows(ctx)
	} else {
		return a.CreateScreenshotMac(ctx)
	}
}

func (a *App) CreateScreenshotWindows(ctx context.Context) (string, error) {
	var cmd *exec.Cmd

	cmd = exec.Command("snippingtool.exe")
	if err := cmd.Start(); err != nil {
		return "", fmt.Errorf("failed to start snipping tool: %v", err)
	}

	// 等待工具启动并自动进入截图模式
	time.Sleep(1000 * time.Millisecond)
	robotgo.KeyTap("enter")
	// 轮询检查剪贴板是否有图片，最多等待10秒
	var imgData []byte
	var err error
	maxAttempts := 5
	for i := 0; i < maxAttempts; i++ {
		time.Sleep(500 * time.Millisecond)
		imgData, err = a.getClipboardImage(ctx)
		if err == nil && len(imgData) > 0 {
			// 强制关闭截图工具
			exec.Command("taskkill", "/IM", "snippingtool.exe", "/F").Run()
			// 清理剪贴板
			runtime.ClipboardSetText(ctx, "")
			break
		}
		// 检查 snippingtool.exe 是否还在运行
		out, _ := exec.Command("tasklist", "/FI", "IMAGENAME eq snippingtool.exe").Output()
		if !strings.Contains(strings.ToLower(string(out)), "snippingtool.exe") {
			println("snippingtool.exe 已关闭")
			break
		}
	}
	exec.Command("taskkill", "/IM", "snippingtool.exe", "/F").Run()
	if len(imgData) == 0 {
		return "", fmt.Errorf("screenshot timeout or cancelled by user")
	}

	// 转换为base64
	base64Str := base64.StdEncoding.EncodeToString(imgData)
	return "data:image/png;base64," + base64Str, nil
}

func (a *App) CreateScreenshotMac(ctx context.Context) (string, error) {
	// 生成带时间戳的文件名
	timestamp := time.Now().Format("20060102_150405")
	tempDir := os.TempDir()
	filename := filepath.Join(tempDir, fmt.Sprintf("PopAsk_Screenshot_%s.png", timestamp))
	println("filename", filename)
	var cmd *exec.Cmd

	// macOS: 使用screencapture
	cmd = exec.Command("screencapture", "-i", filename)
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
	base64WithPrefix := "data:image/png;base64," + base64Str

	// 清理临时文件
	os.Remove(filename)

	return base64WithPrefix, nil
}

// getClipboardImage 获取剪贴板中的图片数据
func (a *App) getClipboardImage(ctx context.Context) ([]byte, error) {
	// 使用PowerShell获取剪贴板图片
	cmd := exec.Command("powershell", "-Command", `
		Add-Type -AssemblyName System.Windows.Forms
		$clipboard = [System.Windows.Forms.Clipboard]::GetImage()
		if ($clipboard) {
			$stream = New-Object System.IO.MemoryStream
			$clipboard.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
			$bytes = $stream.ToArray()
			$stream.Close()
			[System.Convert]::ToBase64String($bytes)
		} else {
			""
		}
	`)

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get clipboard image: %v", err)
	}

	// 移除输出中的换行符
	base64Str := strings.TrimSpace(string(output))
	if base64Str == "" {
		return nil, fmt.Errorf("no image found in clipboard")
	}

	// 解码base64
	imgData, err := base64.StdEncoding.DecodeString(base64Str)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base64 image: %v", err)
	}

	return imgData, nil
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

const SERVER_URL = "https://extension.migaox.com"

const BIANXIE_URL = "https://api.bianxie.ai"

const OPENHUB_URL = "https://api.openai-hub.com"

// const SERVER_URL = "http://localhost:4000"

type ChatRequest struct {
	Message string `json:"message"`
}

type ChatRequestV2 struct {
	Messages string `json:"messages"`
}

type BianxieChatRequest struct {
	Messages []map[string]interface{} `json:"messages"`
	Model    string                   `json:"model"`
	Stream   bool                     `json:"stream"`
}

type BianxieChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}
type OpenHubChatRequest struct {
	Messages []map[string]interface{} `json:"messages"`
	Model    string                   `json:"model"`
	Stream   bool                     `json:"stream"`
}

type OpenHubChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
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
func (a *App) ChatAPIV2(messages string) (ChatResponse, error) {
	var chatResponse ChatResponse

	requestBody, _ := json.Marshal(ChatRequestV2{Messages: messages})
	url := fmt.Sprintf("%s/ai-translator/openai/chat", SERVER_URL)
	response, err := MakePostRequest(url, "", requestBody)

	if err != nil {
		return ChatResponse{}, err
	}

	json.Unmarshal(response, &chatResponse)

	return chatResponse, nil
}
func (a *App) AIBianxieAPI(messages string) (ChatResponse, error) {
	var BianxieChatResponse BianxieChatResponse
	parsedMessages := []map[string]interface{}{}
	json.Unmarshal([]byte(messages), &parsedMessages)
	requestBody, _ := json.Marshal(BianxieChatRequest{Messages: parsedMessages, Model: "gpt-3.5-turbo", Stream: false})
	// println("requestBody", string(requestBody))
	url := fmt.Sprintf("%s/v1/chat/completions", BIANXIE_URL)
	response, err := MakePostRequest(url, "sk-8SjlkyqUQMESPzZdfma7abopO9HcZ3epYmwckJcMAQwLnPHD", requestBody)

	if err != nil {
		return ChatResponse{Code: 500, Data: err.Error()}, err
	}

	json.Unmarshal(response, &BianxieChatResponse)

	return ChatResponse{Code: 200, Data: BianxieChatResponse.Choices[0].Message.Content}, nil
}
func (a *App) AIOpenHubAPI(messages string) (ChatResponse, error) {
	var OpenHubChatResponse OpenHubChatResponse
	parsedMessages := []map[string]interface{}{}
	json.Unmarshal([]byte(messages), &parsedMessages)
	requestBody, _ := json.Marshal(BianxieChatRequest{Messages: parsedMessages, Model: "gpt-3.5-turbo", Stream: false})
	// println("requestBody", string(requestBody))
	url := fmt.Sprintf("%s/v1/chat/completions", OPENHUB_URL)
	response, err := MakePostRequest(url, "sk-S1KQNcR9Op9Er1VmeGVj3NhPf5Hsa0aq3aAU6zpkmOwUI8TJ", requestBody)

	if err != nil {
		return ChatResponse{Code: 500, Data: err.Error()}, err
	}

	json.Unmarshal(response, &OpenHubChatResponse)

	return ChatResponse{Code: 200, Data: OpenHubChatResponse.Choices[0].Message.Content}, nil
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

// LoadPrompts 从嵌入的 CSV 文件中读取提示词数据
func (a *App) LoadPrompts() ([]Prompt, error) {
	// 读取嵌入的 CSV 文件
	data, err := csvData.ReadFile("data/prompts.csv")
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV file: %w", err)
	}

	// 创建 CSV reader
	reader := csv.NewReader(strings.NewReader(string(data)))

	// 读取所有记录
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV: %w", err)
	}

	if len(records) < 2 {
		return []Prompt{}, nil
	}

	// 跳过标题行，解析数据
	var prompts []Prompt
	for i := 1; i < len(records); i++ {
		record := records[i]
		if len(record) >= 3 {
			prompt := Prompt{
				Act:     strings.TrimSpace(record[0]),
				Prompt:  strings.TrimSpace(record[1]),
				ForDevs: strings.TrimSpace(record[2]),
			}
			prompts = append(prompts, prompt)
		}
	}

	return prompts, nil
}

// GetPromptsCSV 返回原始 CSV 文本内容
func (a *App) GetPromptsCSV() (string, error) {
	data, err := csvData.ReadFile("data/prompts.csv")
	if err != nil {
		return "", fmt.Errorf("failed to read CSV file: %w", err)
	}
	return string(data), nil
}
