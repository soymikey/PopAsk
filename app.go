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

	hook "github.com/robotn/gohook"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const COMMAND_KEY_CODE = 3675
const SPACE_KEY_CODE = 57

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
}

// domReady is called after front-end resources have been loaded
func (a *App) domReady(ctx context.Context) {
	// var lastSpaceTime time.Time
	// var lastCmdTime time.Time
	// hook.Register(hook.KeyUp, []string{}, func(e hook.Event) {
	// 	// 注册双击空格键
	// 	if e.Keycode == SPACE_KEY_CODE {

	// 		spaceNow := time.Now()
	// 		if !lastSpaceTime.IsZero() && spaceNow.Sub(lastSpaceTime) < 300*time.Millisecond {
	// 			println("Double space detected!")

	// 			// 开始截图
	// 			base64Str, err := a.CreateScreenshot(ctx)
	// 			if err != nil {
	// 				fmt.Printf("Error: %v\n", err)
	// 				return
	// 			}
	// 			runtime.EventsEmit(ctx, "CREATE_SCREENSHOT", base64Str)
	// 			println("Screenshot created:")

	// 		}
	// 		lastSpaceTime = spaceNow
	// 	}
	// 	// 注册双击cmd
	// 	if e.Keycode == COMMAND_KEY_CODE {
	// 		cmdNow := time.Now()
	// 		if !lastCmdTime.IsZero() && cmdNow.Sub(lastCmdTime) < 300*time.Millisecond {
	// 			println("Double command detected!")

	// 			text, err := a.GetSelection(ctx)
	// 			if err != nil {
	// 				fmt.Printf("Error: %v\n", err)
	// 				return
	// 			}
	// 			//发送文本
	// 			if len(text) == 0 {
	// 				return
	// 			}

	// 			//dsfadfasdfelo worl testl
	// 			runtime.EventsEmit(ctx, "GET_SELECTION", text)
	// 			println("Selected text:", text)

	// 		}
	// 		lastCmdTime = cmdNow
	// 	}
	// })
	// Ctrl/Cmd + Shift + O
	hook.Register(hook.KeyDown, []string{"ctrl", "shift", "o"}, func(e hook.Event) {
		// 开始截图
		base64Str, err := a.CreateScreenshot(ctx)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			return
		}
		runtime.EventsEmit(ctx, "CREATE_SCREENSHOT", base64Str)
		println("Screenshot created:")

	})
	// Ctrl/Cmd + Shift + S
	hook.Register(hook.KeyUp, []string{"ctrl", "shift", "s"}, func(e hook.Event) {
		text, err := a.GetSelection(ctx)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			return
		}
		//发送文本
		if len(text) == 0 {
			return
		}

		//dsfadfasdfelo worl testl
		runtime.EventsEmit(ctx, "GET_SELECTION", text)
		println("Selected text:", text)
	})

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
	// time.Sleep(100 * time.Millisecond)

	// 获取剪贴板内容
	text, err := runtime.ClipboardGetText(ctx)
	println("text1:", text)
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
