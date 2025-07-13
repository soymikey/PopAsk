package main

import (
	"fmt"
	"log"
	"os"
)

type LogService struct {
	BaseService
	fileLogger *log.Logger
	logFile    *os.File
	isDev      bool
}

func NewLogService() *LogService {
	service := &LogService{}

	// 判断是否为开发环境
	service.isDev = service.IsDevelopment()

	if service.isDev {
		// 开发环境：只输出到控制台
		fmt.Printf("[INFO] Running in development mode, logs will only output to console\n")
		return service
	}

	// 生产环境：输出到文件
	// 创建日志目录
	logDir := "logs"
	if err := service.EnsureDirectory(logDir); err != nil {
		fmt.Printf("Failed to create log directory: %v\n", err)
		return service
	}

	// 创建日志文件（按日期命名）
	logFileName := service.JoinPath(logDir, fmt.Sprintf("popask_%s.log", service.FormatDate()))
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
	timestamp := l.FormatDateTime()
	formattedMsg := fmt.Sprintf("[%s] [INFO] "+msg, append([]interface{}{timestamp}, args...)...)

	// 输出到控制台
	fmt.Printf(formattedMsg + "\n")

	// 生产环境才输出到文件
	if !l.isDev && l.fileLogger != nil {
		l.fileLogger.Printf(formattedMsg)
	}
}

func (l *LogService) Error(msg string, args ...interface{}) {
	timestamp := l.FormatDateTime()
	formattedMsg := fmt.Sprintf("[%s] [ERROR] "+msg, append([]interface{}{timestamp}, args...)...)

	// 输出到控制台
	fmt.Printf(formattedMsg + "\n")

	// 生产环境才输出到文件
	if !l.isDev && l.fileLogger != nil {
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
