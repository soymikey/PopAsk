package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// API URLs
const SERVER_URL = "https://extension.migaox.com"
const BIANXIE_URL = "https://api.bianxie.ai"
const OPENHUB_URL = "https://api.openai-hub.com"

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

	requestBody, _ := json.Marshal(ChatRequest{Message: message})
	url := fmt.Sprintf("%s/ai-translator/openai", SERVER_URL)
	response, err := api.MakePostRequest(url, "", requestBody)

	if err != nil {
		api.logSvc.Error("ChatAPI failed: %v", err)
		return ChatResponse{}, err
	}

	json.Unmarshal(response, &chatResponse)
	api.logSvc.Info("ChatAPI completed successfully, response code: %d", chatResponse.Code)

	return chatResponse, nil
}

func (api *APIService) ChatAPIV2(messages string) (ChatResponse, error) {
	api.logSvc.Info("Calling ChatAPIV2 with messages length: %d", len(messages))

	var chatResponse ChatResponse

	requestBody, _ := json.Marshal(ChatRequestV2{Messages: messages})
	url := fmt.Sprintf("%s/ai-translator/openai/chat", SERVER_URL)
	response, err := api.MakePostRequest(url, "", requestBody)

	if err != nil {
		api.logSvc.Error("ChatAPIV2 failed: %v", err)
		return ChatResponse{}, err
	}

	json.Unmarshal(response, &chatResponse)
	api.logSvc.Info("ChatAPIV2 completed successfully, response code: %d", chatResponse.Code)

	return chatResponse, nil
}

func (api *APIService) AIBianxieAPI(messages string) (ChatResponse, error) {
	api.logSvc.Info("Calling AIBianxieAPI with messages length: %d", len(messages))

	var BianxieChatResponse BianxieChatResponse
	parsedMessages := []map[string]interface{}{}
	json.Unmarshal([]byte(messages), &parsedMessages)
	requestBody, _ := json.Marshal(BianxieChatRequest{Messages: parsedMessages, Model: "gpt-3.5-turbo", Stream: false})
	// println("requestBody", string(requestBody))
	url := fmt.Sprintf("%s/v1/chat/completions", BIANXIE_URL)
	response, err := api.MakePostRequest(url, "sk-8SjlkyqUQMESPzZdfma7abopO9HcZ3epYmwckJcMAQwLnPHD", requestBody)

	if err != nil {
		api.logSvc.Error("AIBianxieAPI failed: %v", err)
		return ChatResponse{Code: 500, Data: err.Error()}, err
	}

	json.Unmarshal(response, &BianxieChatResponse)
	api.logSvc.Info("AIBianxieAPI completed successfully")

	return ChatResponse{Code: 200, Data: BianxieChatResponse.Choices[0].Message.Content}, nil
}

func (api *APIService) AIOpenHubAPI(messages string) (ChatResponse, error) {
	api.logSvc.Info("Calling AIOpenHubAPI with messages length: %d", len(messages))

	var OpenHubChatResponse OpenHubChatResponse
	parsedMessages := []map[string]interface{}{}
	json.Unmarshal([]byte(messages), &parsedMessages)
	requestBody, _ := json.Marshal(BianxieChatRequest{Messages: parsedMessages, Model: "gpt-3.5-turbo", Stream: false})
	// println("requestBody", string(requestBody))
	url := fmt.Sprintf("%s/v1/chat/completions", OPENHUB_URL)
	response, err := api.MakePostRequest(url, "sk-S1KQNcR9Op9Er1VmeGVj3NhPf5Hsa0aq3aAU6zpkmOwUI8TJ", requestBody)

	if err != nil {
		api.logSvc.Error("AIOpenHubAPI failed: %v", err)
		return ChatResponse{Code: 500, Data: err.Error()}, err
	}

	json.Unmarshal(response, &OpenHubChatResponse)
	api.logSvc.Info("AIOpenHubAPI completed successfully")

	return ChatResponse{Code: 200, Data: OpenHubChatResponse.Choices[0].Message.Content}, nil
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
