package main

import (
	"context"
	"embed"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"strings"
)

//go:embed data/prompts.csv
var csvData embed.FS

//go:embed data/prompts.json
var jsonData embed.FS

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
func (p *PromptService) LoadCSVPrompts() ([]Prompt, error) {
	p.logSvc.Info("Loading prompts from embedded CSV file")

	// 读取嵌入的 CSV 文件
	data, err := csvData.ReadFile("data/prompts.csv")
	if err != nil {
		p.logSvc.Error("Failed to read CSV file: %v", err)
		return nil, fmt.Errorf("failed to read CSV file: %w", err)
	}

	// 创建 CSV reader
	reader := csv.NewReader(strings.NewReader(string(data)))

	// 读取所有记录
	records, err := reader.ReadAll()
	if err != nil {
		p.logSvc.Error("Failed to parse CSV: %v", err)
		return nil, fmt.Errorf("failed to parse CSV: %w", err)
	}

	if len(records) < 2 {
		p.logSvc.Info("CSV file has insufficient records, returning empty prompts")
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

	p.logSvc.Info("Successfully loaded %d prompts", len(prompts))
	return prompts, nil
}

// 返回 categories 结构
type PromptCategory struct {
	Name    string   `json:"name"`
	Prompts []Prompt `json:"prompts"`
}

func (p *PromptService) LoadJSONPrompts() ([]PromptCategory, error) {
	p.logSvc.Info("Loading prompts from embedded JSON file")

	data, err := jsonData.ReadFile("data/prompts.json")
	if err != nil {
		p.logSvc.Error("Failed to read JSON file: %v", err)
		return nil, fmt.Errorf("failed to read JSON file: %w", err)
	}

	// 兼容 categories 或 groups
	var root struct {
		Categories []struct {
			Name    string   `json:"name"`
			Prompts []Prompt `json:"prompts"`
		} `json:"categories"`
	}

	if err := json.Unmarshal(data, &root); err != nil {
		p.logSvc.Error("Failed to parse JSON: %v", err)
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	var categories []PromptCategory
	if len(root.Categories) > 0 {
		for _, c := range root.Categories {
			categories = append(categories, PromptCategory{
				Name:    c.Name,
				Prompts: c.Prompts,
			})
		}
		p.logSvc.Info("Loaded %d categories from JSON", len(categories))
	} else {
		p.logSvc.Error("No categories or groups found in JSON")
		return nil, fmt.Errorf("no categories or groups found in JSON")
	}

	return categories, nil
}

// GetPromptsCSV 返回原始 CSV 文本内容
func (p *PromptService) GetPromptsCSV() (string, error) {
	p.logSvc.Info("Getting raw CSV content")

	data, err := csvData.ReadFile("data/prompts.csv")
	if err != nil {
		p.logSvc.Error("Failed to read CSV file: %v", err)
		return "", fmt.Errorf("failed to read CSV file: %w", err)
	}

	p.logSvc.Info("Successfully retrieved CSV content, size: %d bytes", len(data))
	return string(data), nil
}

func (a *App) LoadPromptsCSV() ([]Prompt, error) {
	promptSvc := NewPromptService(a.ctx, a)
	return promptSvc.LoadCSVPrompts()
}

func (a *App) GetPromptsCSV() (string, error) {
	promptSvc := NewPromptService(a.ctx, a)
	return promptSvc.GetPromptsCSV()
}

func (a *App) LoadPromptsJSON() ([]PromptCategory, error) {
	promptSvc := NewPromptService(a.ctx, a)
	return promptSvc.LoadJSONPrompts()
}
