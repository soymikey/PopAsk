package main

import (
	"fmt"
	"time"
)

type LogService struct{}

func NewLogService() *LogService {
	return &LogService{}
}

func (l *LogService) Info(msg string, args ...interface{}) {
	fmt.Printf("[%s] [INFO] "+msg+"\n", append([]interface{}{time.Now().Format("2006-01-02 15:04:05")}, args...)...)
}

func (l *LogService) Error(msg string, args ...interface{}) {
	fmt.Printf("[%s] [ERROR] "+msg+"\n", append([]interface{}{time.Now().Format("2006-01-02 15:04:05")}, args...)...)
}
