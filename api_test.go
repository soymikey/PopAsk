package main

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAPIService_makeRequest_statusCode(t *testing.T) {
	app := NewApp()
	ctx := context.Background()
	api := NewAPIService(ctx, app)

	tests := []struct {
		name       string
		statusCode int
		body       string
		wantErr    bool
	}{
		{
			name:       "200 OK",
			statusCode: 200,
			body:       `{"ok":true}`,
			wantErr:    false,
		},
		{
			name:       "400 Bad Request",
			statusCode: 400,
			body:       `{"error":"bad request"}`,
			wantErr:    true,
		},
		{
			name:       "500 Internal Server Error",
			statusCode: 500,
			body:       `{"error":"server error"}`,
			wantErr:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.statusCode)
				_, _ = w.Write([]byte(tt.body))
			}))
			defer server.Close()

			body, err := api.makeRequest("GET", server.URL, "", nil)
			if tt.wantErr {
				if err == nil {
					t.Errorf("makeRequest() expected error for status %d", tt.statusCode)
				}
				return
			}
			if err != nil {
				t.Errorf("makeRequest() unexpected error: %v", err)
				return
			}
			if string(body) != tt.body {
				t.Errorf("makeRequest() body = %q, want %q", body, tt.body)
			}
		})
	}
}

func TestAPIService_chatCompletions_requestBody(t *testing.T) {
	var receivedBody []byte
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedBody, _ = io.ReadAll(r.Body)
		w.WriteHeader(200)
		_, _ = w.Write([]byte(`{"choices":[{"message":{"content":"hi"}}]}`))
	}))
	defer server.Close()

	app := NewApp()
	ctx := context.Background()
	api := NewAPIService(ctx, app)

	messages := []map[string]interface{}{
		{"role": "user", "content": "hello"},
	}
	content, err := api.chatCompletions(server.URL, "token", messages, "gpt-3.5-turbo")
	if err != nil {
		t.Fatalf("chatCompletions() error: %v", err)
	}
	if content != "hi" {
		t.Errorf("chatCompletions() content = %q, want %q", content, "hi")
	}
	if len(receivedBody) == 0 {
		t.Error("chatCompletions() did not send request body")
	}
}
