package main

import (
	"context"
	"embed"
	"encoding/csv"
	"fmt"
	"strings"
)

//go:embed data/prompts.csv
var csvData embed.FS

// Prompt 结构体用于存储提示词数据
type Prompt struct {
	Act     string `json:"act"`
	Prompt  string `json:"prompt"`
	ForDevs string `json:"for_devs"`
}

// PromptService 提示词服务
type PromptService struct {
	BaseService
	prompts []Prompt
}

// NewPromptService 创建新的提示词服务
func NewPromptService(ctx context.Context, app *App) *PromptService {
	service := &PromptService{}
	service.SetContext(ctx)
	service.SetApp(app)
	return service
}

// LoadPrompts 从嵌入的 CSV 文件中读取提示词数据
func (p *PromptService) LoadPrompts() ([]Prompt, error) {
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
func (p *PromptService) GetPromptsCSV() (string, error) {
	data, err := csvData.ReadFile("data/prompts.csv")
	if err != nil {
		return "", fmt.Errorf("failed to read CSV file: %w", err)
	}
	return string(data), nil
}

// 保持向后兼容的方法
func (a *App) LoadPrompts() ([]Prompt, error) {
	promptSvc := NewPromptService(a.ctx, a)
	return promptSvc.LoadPrompts()
}

func (a *App) GetPromptsCSV() (string, error) {
	promptSvc := NewPromptService(a.ctx, a)
	return promptSvc.GetPromptsCSV()
}
