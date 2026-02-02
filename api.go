package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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
		client: &http.Client{},
	}
	service.SetContext(ctx)
	service.SetApp(app)
	return service
}

// HTTP request helper functions
func (api *APIService) makeRequest(requestType, url, token string, payload []byte) ([]byte, error) {
	api.logSvc.Info("Making %s request to: %s", requestType, url)

	var request *http.Request

	if payload != nil {
		requestBody := bytes.NewReader(payload)
		request, _ = http.NewRequest(requestType, url, requestBody)
	} else {
		request, _ = http.NewRequest(requestType, url, nil)
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

	body, _ := io.ReadAll(response.Body)
	api.logSvc.Info("HTTP request completed successfully, response size: %d bytes", len(body))

	return body, nil
}

func (api *APIService) MakeGetRequest(url string, token string) ([]byte, error) {
	return api.makeRequest("GET", url, token, nil)
}

func (api *APIService) MakePostRequest(url, token string, payload []byte) ([]byte, error) {
	return api.makeRequest("POST", url, token, payload)
}

// API functions
func (api *APIService) ChatAPI(message string) (ChatResponse, error) {
	api.logSvc.Info("Calling ChatAPI with message length: %d", len(message))

	var chatResponse ChatResponse

	requestBody, err := json.Marshal(ChatRequest{Message: message})
	if err != nil {
		api.logSvc.Error("ChatAPI marshal failed: %v", err)
		return ChatResponse{}, fmt.Errorf("marshal request: %w", err)
	}
	url := fmt.Sprintf("%s/ai-translator/openai", api.EnvOrDefault("SERVER_URL", "https://extension.migaox.com"))
	response, err := api.MakePostRequest(url, "", requestBody)
	if err != nil {
		api.logSvc.Error("ChatAPI failed: %v", err)
		return ChatResponse{}, err
	}
	if err := json.Unmarshal(response, &chatResponse); err != nil {
		api.logSvc.Error("ChatAPI unmarshal failed: %v", err)
		return ChatResponse{}, fmt.Errorf("unmarshal response: %w", err)
	}
	api.logSvc.Info("ChatAPI completed successfully, response code: %d", chatResponse.Code)
	return chatResponse, nil
}

func (api *APIService) ChatAPIV2(messages string) (ChatResponse, error) {
	api.logSvc.Info("Calling ChatAPIV2 with messages length: %d", len(messages))

	var chatResponse ChatResponse

	requestBody, err := json.Marshal(ChatRequestV2{Messages: messages})
	if err != nil {
		api.logSvc.Error("ChatAPIV2 marshal failed: %v", err)
		return ChatResponse{}, fmt.Errorf("marshal request: %w", err)
	}
	url := fmt.Sprintf("%s/ai-translator/openai/chat", api.EnvOrDefault("SERVER_URL", "https://extension.migaox.com"))
	response, err := api.MakePostRequest(url, "", requestBody)
	if err != nil {
		api.logSvc.Error("ChatAPIV2 failed: %v", err)
		return ChatResponse{}, err
	}
	if err := json.Unmarshal(response, &chatResponse); err != nil {
		api.logSvc.Error("ChatAPIV2 unmarshal failed: %v", err)
		return ChatResponse{}, fmt.Errorf("unmarshal response: %w", err)
	}
	api.logSvc.Info("ChatAPIV2 completed successfully, response code: %d", chatResponse.Code)
	return chatResponse, nil
}

func (api *APIService) AIBianxieAPI(messages string) (ChatResponse, error) {
	api.logSvc.Info("Calling AIBianxieAPI with messages length: %d", len(messages))

	parsedMessages := []map[string]interface{}{}
	if err := json.Unmarshal([]byte(messages), &parsedMessages); err != nil {
		api.logSvc.Error("AIBianxieAPI unmarshal messages failed: %v", err)
		return ChatResponse{Code: 400, Data: err.Error()}, fmt.Errorf("unmarshal messages: %w", err)
	}
	requestBody, err := json.Marshal(BianxieChatRequest{Messages: parsedMessages, Model: "gpt-3.5-turbo", Stream: false})
	if err != nil {
		api.logSvc.Error("AIBianxieAPI marshal failed: %v", err)
		return ChatResponse{Code: 500, Data: err.Error()}, fmt.Errorf("marshal request: %w", err)
	}
	url := fmt.Sprintf("%s/v1/chat/completions", api.EnvOrDefault("BIANXIE_URL", "https://api.bianxie.ai"))
	token := api.EnvOrDefault("BIANXIE_API_KEY", "")
	response, err := api.MakePostRequest(url, token, requestBody)
	if err != nil {
		api.logSvc.Error("AIBianxieAPI failed: %v", err)
		return ChatResponse{Code: 500, Data: err.Error()}, err
	}

	var bianxieResp BianxieChatResponse
	if err := json.Unmarshal(response, &bianxieResp); err != nil {
		api.logSvc.Error("AIBianxieAPI unmarshal response failed: %v", err)
		return ChatResponse{Code: 500, Data: err.Error()}, fmt.Errorf("unmarshal response: %w", err)
	}
	if len(bianxieResp.Choices) == 0 {
		api.logSvc.Error("AIBianxieAPI empty choices")
		return ChatResponse{Code: 502, Data: "empty choices from API"}, fmt.Errorf("empty choices from API")
	}
	api.logSvc.Info("AIBianxieAPI completed successfully")
	return ChatResponse{Code: 200, Data: bianxieResp.Choices[0].Message.Content}, nil
}

func (api *APIService) AIOpenHubAPI(messages string) (ChatResponse, error) {
	api.logSvc.Info("Calling AIOpenHubAPI with messages length: %d", len(messages))

	parsedMessages := []map[string]interface{}{}
	if err := json.Unmarshal([]byte(messages), &parsedMessages); err != nil {
		api.logSvc.Error("AIOpenHubAPI unmarshal messages failed: %v", err)
		return ChatResponse{Code: 400, Data: err.Error()}, fmt.Errorf("unmarshal messages: %w", err)
	}
	requestBody, err := json.Marshal(BianxieChatRequest{Messages: parsedMessages, Model: "gpt-3.5-turbo", Stream: false})
	if err != nil {
		api.logSvc.Error("AIOpenHubAPI marshal failed: %v", err)
		return ChatResponse{Code: 500, Data: err.Error()}, fmt.Errorf("marshal request: %w", err)
	}
	url := fmt.Sprintf("%s/v1/chat/completions", api.EnvOrDefault("OPENHUB_URL", "https://api.openai-hub.com"))
	token := api.EnvOrDefault("OPENHUB_API_KEY", "")
	response, err := api.MakePostRequest(url, token, requestBody)
	if err != nil {
		api.logSvc.Error("AIOpenHubAPI failed: %v", err)
		return ChatResponse{Code: 500, Data: err.Error()}, err
	}

	var openHubResp OpenHubChatResponse
	if err := json.Unmarshal(response, &openHubResp); err != nil {
		api.logSvc.Error("AIOpenHubAPI unmarshal response failed: %v", err)
		return ChatResponse{Code: 500, Data: err.Error()}, fmt.Errorf("unmarshal response: %w", err)
	}
	if len(openHubResp.Choices) == 0 {
		api.logSvc.Error("AIOpenHubAPI empty choices")
		return ChatResponse{Code: 502, Data: "empty choices from API"}, fmt.Errorf("empty choices from API")
	}
	api.logSvc.Info("AIOpenHubAPI completed successfully")
	return ChatResponse{Code: 200, Data: openHubResp.Choices[0].Message.Content}, nil
}

// 保持向后兼容的方法
func makeRequest(requestType, url, token string, payload []byte) ([]byte, error) {
	apiSvc := NewAPIService(context.Background(), nil)
	return apiSvc.makeRequest(requestType, url, token, payload)
}

func MakeGetRequest(url string, token string) ([]byte, error) {
	apiSvc := NewAPIService(context.Background(), nil)
	return apiSvc.MakeGetRequest(url, token)
}

func MakePostRequest(url, token string, payload []byte) ([]byte, error) {
	apiSvc := NewAPIService(context.Background(), nil)
	return apiSvc.MakePostRequest(url, token, payload)
}

func (a *App) ChatAPI(message string) (ChatResponse, error) {
	apiSvc := NewAPIService(a.ctx, a)
	return apiSvc.ChatAPI(message)
}

func (a *App) ChatAPIV2(messages string) (ChatResponse, error) {
	apiSvc := NewAPIService(a.ctx, a)
	return apiSvc.ChatAPIV2(messages)
}

func (a *App) AIBianxieAPI(messages string) (ChatResponse, error) {
	apiSvc := NewAPIService(a.ctx, a)
	return apiSvc.AIBianxieAPI(messages)
}

func (a *App) AIOpenHubAPI(messages string) (ChatResponse, error) {
	apiSvc := NewAPIService(a.ctx, a)
	return apiSvc.AIOpenHubAPI(messages)
}
