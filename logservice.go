package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
)

type LogService struct {
	fileLogger *log.Logger
	logFile    *os.File
}

func NewLogService() *LogService {
	service := &LogService{}

	// 创建日志目录
	logDir := "logs"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		fmt.Printf("Failed to create log directory: %v\n", err)
		return service
	}

	// 创建日志文件（按日期命名）
	logFileName := filepath.Join(logDir, fmt.Sprintf("popask_%s.log", time.Now().Format("2006-01-02")))
	logFile, err := os.OpenFile(logFileName, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		fmt.Printf("Failed to open log file: %v\n", err)
		return service
	}

	service.logFile = logFile
	service.fileLogger = log.New(logFile, "", 0)

	return service
}

func (l *LogService) Info(msg string, args ...interface{}) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	formattedMsg := fmt.Sprintf("[%s] [INFO] "+msg, append([]interface{}{timestamp}, args...)...)

	// 输出到控制台
	fmt.Printf(formattedMsg + "\n")

	// 输出到文件
	if l.fileLogger != nil {
		l.fileLogger.Printf(formattedMsg)
	}
}

func (l *LogService) Error(msg string, args ...interface{}) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	formattedMsg := fmt.Sprintf("[%s] [ERROR] "+msg, append([]interface{}{timestamp}, args...)...)

	// 输出到控制台
	fmt.Printf(formattedMsg + "\n")

	// 输出到文件
	if l.fileLogger != nil {
		l.fileLogger.Printf(formattedMsg)
	}
}

// Close 关闭日志文件
func (l *LogService) Close() error {
	if l.logFile != nil {
		return l.logFile.Close()
	}
	return nil
}
