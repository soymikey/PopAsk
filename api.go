package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Request/Response structs
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

// APIService API服务
type APIService struct {
	BaseService
	client *http.Client
}

// NewAPIService 创建新的API服务
func NewAPIService(ctx context.Context, app *App) *APIService {
	service := &APIService{
		client: &http.Client{
			Timeout: DefaultHTTPClientTimeout,
		},
	}
	service.SetContext(ctx)
	service.SetApp(app)
	return service
}

// HTTP request helper functions
func (api *APIService) makeRequest(requestType, url, token string, payload []byte) ([]byte, error) {
	api.logSvc.Info("Making %s request to: %s", requestType, url)
	if api.IsDevelopment() && len(payload) > 0 {
		api.logSvc.Info("Request body: %s", string(payload))
	}

	var request *http.Request
	var errReq error

	if payload != nil {
		requestBody := bytes.NewReader(payload)
		request, errReq = http.NewRequest(requestType, url, requestBody)
	} else {
		request, errReq = http.NewRequest(requestType, url, nil)
	}
	if errReq != nil {
		api.logSvc.Error("NewRequest failed: %v", errReq)
		return nil, fmt.Errorf("new request: %w", errReq)
	}

	request.Header.Add("Content-Type", "application/json")

	if token != "" {
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	}

	response, err := api.client.Do(request)
	if err != nil {
		api.logSvc.Error("HTTP request failed: %v", err)
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		api.logSvc.Error("Read body failed: %v", err)
		return nil, fmt.Errorf("read body: %w", err)
	}
	api.logSvc.Info("HTTP request completed successfully, response size: %d bytes", len(body))
	if api.IsDevelopment() {
		api.logSvc.Info("Response body: %s", string(body))
	}

	if response.StatusCode >= 400 {
		api.logSvc.Error("HTTP error status: %d", response.StatusCode)
		return nil, fmt.Errorf("HTTP %d: %s", response.StatusCode, string(body))
	}

	return body, nil
}

func (api *APIService) MakeGetRequest(url string, token string) ([]byte, error) {
	return api.makeRequest("GET", url, token, nil)
}

func (api *APIService) MakePostRequest(url, token string, payload []byte) ([]byte, error) {
	return api.makeRequest("POST", url, token, payload)
}

// chatCompletions calls an OpenAI-compatible chat completions endpoint and returns the first choice content.
func (api *APIService) chatCompletions(url, token string, messages []map[string]interface{}, model string) (string, error) {
	req := BianxieChatRequest{Messages: messages, Model: model, Stream: false}
	requestBody, err := json.Marshal(req)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}
	response, err := api.MakePostRequest(url, token, requestBody)
	if err != nil {
		return "", err
	}
	var resp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(response, &resp); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}
	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("empty choices from API")
	}
	return resp.Choices[0].Message.Content, nil
}

// API functions
func (api *APIService) ChatAPI(message string) (ChatResponse, error) {
	api.logSvc.Info("Calling ChatAPI with message length: %d", len(message))

	requestBody, err := json.Marshal(ChatRequest{Message: message})
	if err != nil {
		api.logSvc.Error("ChatAPI marshal failed: %v", err)
		return ChatResponse{}, fmt.Errorf("marshal request: %w", err)
	}
	url := fmt.Sprintf("%s/pop-ask", api.EnvOrDefault("SERVER_URL", "https://beaptmqzdyznkhktjntq.functions.supabase.co"))
	token := api.EnvOrDefault("SUPABASE_ANON_KEY", "")
	response, err := api.MakePostRequest(url, token, requestBody)
	if err != nil {
		api.logSvc.Error("ChatAPI failed: %v", err)
		return ChatResponse{}, err
	}
	var chatResponse ChatResponse
	if err := json.Unmarshal(response, &chatResponse); err != nil {
		api.logSvc.Error("ChatAPI unmarshal failed: %v", err)
		return ChatResponse{Code: 500, Data: string(response)}, fmt.Errorf("unmarshal response: %w", err)
	}
	api.logSvc.Info("ChatAPI completed successfully, response code: %d", chatResponse.Code)
	return chatResponse, nil
}

func (api *APIService) OpenAIAPI(messages string) (ChatResponse, error) {
	// pop-ask accepts single "message"; same as ChatAPI
	return api.ChatAPI(messages)
}

// CustomOpenAIAPI calls OpenAI API directly with the user's API key.
func (api *APIService) CustomOpenAIAPI(messages string, apiKey string) (ChatResponse, error) {
	api.logSvc.Info("Calling CustomOpenAIAPI with messages length: %d", len(messages))
	if apiKey == "" {
		api.logSvc.Error("CustomOpenAIAPI: apiKey is empty")
		return ChatResponse{Code: 400, Data: "API key is required"}, nil
	}
	var parsedMessages []map[string]interface{}
	if err := json.Unmarshal([]byte(messages), &parsedMessages); err != nil {
		api.logSvc.Error("CustomOpenAIAPI unmarshal messages failed: %v", err)
		return ChatResponse{Code: 400, Data: err.Error()}, fmt.Errorf("unmarshal messages: %w", err)
	}
	content, err := api.chatCompletions("https://api.openai.com/v1/chat/completions", apiKey, parsedMessages, "gpt-3.5-turbo")
	if err != nil {
		api.logSvc.Error("CustomOpenAIAPI failed: %v", err)
		return ChatResponse{Code: 500, Data: err.Error()}, err
	}
	api.logSvc.Info("CustomOpenAIAPI completed successfully")
	return ChatResponse{Code: 200, Data: content}, nil
}

func (api *APIService) AIBianxieAPI(messages string) (ChatResponse, error) {
	api.logSvc.Info("Calling AIBianxieAPI with messages length: %d", len(messages))
	var parsedMessages []map[string]interface{}
	if err := json.Unmarshal([]byte(messages), &parsedMessages); err != nil {
		api.logSvc.Error("AIBianxieAPI unmarshal messages failed: %v", err)
		return ChatResponse{Code: 400, Data: err.Error()}, fmt.Errorf("unmarshal messages: %w", err)
	}
	url := fmt.Sprintf("%s/v1/chat/completions", api.EnvOrDefault("BIANXIE_URL", "https://api.bianxie.ai"))
	token := api.EnvOrDefault("BIANXIE_API_KEY", "")
	content, err := api.chatCompletions(url, token, parsedMessages, "gpt-3.5-turbo")
	if err != nil {
		api.logSvc.Error("AIBianxieAPI failed: %v", err)
		return ChatResponse{Code: 500, Data: err.Error()}, err
	}
	api.logSvc.Info("AIBianxieAPI completed successfully")
	return ChatResponse{Code: 200, Data: content}, nil
}

func (api *APIService) AIOpenHubAPI(messages string) (ChatResponse, error) {
	api.logSvc.Info("Calling AIOpenHubAPI with messages length: %d", len(messages))
	var parsedMessages []map[string]interface{}
	if err := json.Unmarshal([]byte(messages), &parsedMessages); err != nil {
		api.logSvc.Error("AIOpenHubAPI unmarshal messages failed: %v", err)
		return ChatResponse{Code: 400, Data: err.Error()}, fmt.Errorf("unmarshal messages: %w", err)
	}
	url := fmt.Sprintf("%s/v1/chat/completions", api.EnvOrDefault("OPENHUB_URL", "https://api.openai-hub.com"))
	token := api.EnvOrDefault("OPENHUB_API_KEY", "")
	content, err := api.chatCompletions(url, token, parsedMessages, "gpt-3.5-turbo")
	if err != nil {
		api.logSvc.Error("AIOpenHubAPI failed: %v", err)
		return ChatResponse{Code: 500, Data: err.Error()}, err
	}
	api.logSvc.Info("AIOpenHubAPI completed successfully")
	return ChatResponse{Code: 200, Data: content}, nil
}

func (a *App) ChatAPI(message string) (ChatResponse, error) {
	return a.apiSvc.ChatAPI(message)
}

func (a *App) OpenAIAPI(messages string) (ChatResponse, error) {
	return a.apiSvc.OpenAIAPI(messages)
}

func (a *App) CustomOpenAIAPI(messages string, apiKey string) (ChatResponse, error) {
	return a.apiSvc.CustomOpenAIAPI(messages, apiKey)
}

func (a *App) AIBianxieAPI(messages string) (ChatResponse, error) {
	return a.apiSvc.AIBianxieAPI(messages)
}

func (a *App) AIOpenHubAPI(messages string) (ChatResponse, error) {
	return a.apiSvc.AIOpenHubAPI(messages)
}
