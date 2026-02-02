package main

import "time"

// AppConfig holds centralized defaults for window and HTTP client.
// Values can be overridden via environment variables where applicable.
var (
	// Window defaults
	DefaultWindowWidth   = 650
	DefaultWindowHeight  = 900
	DefaultWindowMinWidth  = 650
	DefaultWindowMinHeight = 900

	// HTTP client timeout for API requests (OpenAI, pop-ask, etc.)
	DefaultHTTPClientTimeout = 120 * time.Second
)
