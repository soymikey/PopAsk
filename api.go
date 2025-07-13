package main

import (
	"bytes"
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

// HTTP request helper functions
func makeRequest(requestType, url, token string, payload []byte) ([]byte, error) {
	client := &http.Client{}

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

	response, err := client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	body, _ := io.ReadAll(response.Body)

	return body, nil
}

func MakeGetRequest(url string, token string) ([]byte, error) {
	return makeRequest("GET", url, token, nil)
}

func MakePostRequest(url, token string, payload []byte) ([]byte, error) {
	return makeRequest("POST", url, token, payload)
}

// API functions
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
