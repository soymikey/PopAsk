# PopAsk

A desktop AI assistant that supports quick questions from selected text or screenshots, multiple APIs, OCR, and customizable shortcuts.

## Features

- **AI Chat**: Default service, custom OpenAI API Key, Bianxie, OpenHub, and more
- **Shortcuts**: System-wide hotkeys (e.g. translate selection, OCR, open window only), configurable in Settings
- **OCR**: Screenshot-to-text via Tesseract.js with multi-language support
- **Prompt templates**: Built-in and custom prompts, bindable to shortcuts
- **Chat history**: Sessions and history persisted with Zustand + localStorage
- **Settings**: API Key, OCR languages, shortcuts, and prompt list management

## Tech Stack

| Layer         | Tech                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| Desktop shell | Wails v2 (Go backend + native window)                                                |
| Frontend      | React 18, Vite, Ant Design, Zustand, Tesseract.js, react-markdown                    |
| Backend       | Go (API calls, clipboard, screenshot, global shortcuts via gohook, window control)   |
| Optional      | Supabase Edge Function (`server/supabase/functions/pop-ask`) as default chat backend |

## Prerequisites

- **Go**: Match `go.mod` (currently Go 1.24)
- **Node.js**: 18+ recommended (frontend Vite/React)
- **Platform**: macOS / Windows / Linux
- Network required when using the default cloud service; optional for local/self-hosted API.

## Install & Run

**Install dependencies**

- Frontend: `cd frontend && npm install`
- Go: `go mod download` (or let `wails dev` fetch them)

**Development**

From the project root:

```bash
wails dev
```

This starts the Vite dev server with hot reload. You can also open `http://localhost:34115` in a browser to debug the frontend and call Go methods from devtools.

## Building

Production build:

```bash
wails build
```

Common examples:

```bash
wails build -debug -devtools -clean -upx -nopackage
wails build -clean -upx
```

Output goes to `build/bin` (or Wails default); macOS produces a `.app`, Windows can produce an installer.

## Configuration

Copy `.env.example` to `.env` and fill as needed:

| Variable                          | Purpose                                |
| --------------------------------- | -------------------------------------- |
| `SERVER_URL`                      | Self-hosted / default chat service URL |
| `BIANXIE_URL` / `BIANXIE_API_KEY` | Bianxie AI                             |
| `OPENHUB_URL` / `OPENHUB_API_KEY` | OpenHub                                |

Leaving these unset uses built-in defaults; you can also set an OpenAI API Key in the in-app Settings to use a custom endpoint.

Project config: edit `wails.json`. See [Wails project config](https://wails.io/docs/reference/project-config).

## Project Structure

```
.
├── app.go, api.go, prompt.go, shortcut.go   # App entry, API, prompts, shortcuts
├── clipboard.go, screenshot.go, window.go   # Clipboard, screenshot, window
├── config.go, service_base.go               # Config and service base
├── main.go, wails.json, go.mod
├── data/                    # Embedded prompts.csv, prompts.json
├── frontend/                # Vite + React frontend
│   └── src/
│       ├── components/      # ChatComp, SettingsComp, AskComp, etc.
│       ├── store/           # Zustand state
│       ├── utils/           # Utils and getPromptSelectOptions
│       └── wailsjs/         # Wails-generated Go bindings
├── server/                  # Optional: Supabase Edge Function pop-ask
└── build/                   # Platform build config and icons
```

## Author

Michael Zheng — soymikey0717@gmail.com
