package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"time"

	hook "github.com/robotn/gohook"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const SHIFT_KEY_CODE = 0x38
const COMMAND_KEY_CODE = 0x37

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
	// 注册 Shift 键按下事件
	hook.Register(hook.KeyDown, []string{"shift"}, func(e hook.Event) {
		// 检查是否只有 Shift 键被按下
		if e.Rawcode == SHIFT_KEY_CODE {
			// 添加短暂延迟确保文本已选中
			time.Sleep(100 * time.Millisecond)

			text, err := a.GetSelection(ctx)
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				return
			}
			runtime.EventsEmit(ctx, "GET_SELECTION", text)
			println("Selected text:", text)
		}
	})

	hook.Register(hook.KeyDown, []string{"command"}, func(e hook.Event) {
		if e.Rawcode == COMMAND_KEY_CODE {
			println("Command key pressed")
			time.Sleep(100 * time.Millisecond)
			base64Str, err := a.CreateScreenshot(ctx)
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				return
			}
			runtime.EventsEmit(ctx, "CREATE_SCREENSHOT", base64Str)
			println("Screenshot created:")
		}
	})

	s := hook.Start()
	<-hook.Process(s)
}

func (a *App) GetSelection(ctx context.Context) (string, error) {
	// 模拟 Cmd+C
	cmd := exec.Command("osascript", "-e", "tell application \"System Events\" to keystroke \"c\" using command down")
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("failed to execute copy command: %v", err)
	}

	// 添加短暂延迟确保复制完成
	time.Sleep(100 * time.Millisecond)

	// 获取剪贴板内容
	text, err := runtime.ClipboardGetText(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get clipboard text: %v", err)
	}

	return text, nil
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
