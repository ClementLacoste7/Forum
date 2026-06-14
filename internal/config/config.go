package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port         string
	DatabasePath string
	JWTSecret    string
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	AppURL       string
}

// getEnv returns the value of an env variable or a fallback default
func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func Load() *Config {
	smtpPort, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))

	port := getEnv("PORT", "8081")
	if port != "" && port[0] != ':' {
		port = ":" + port
	}

	return &Config{
		Port:         port,
		DatabasePath: getEnv("DATABASE_PATH", "./forum.db"),
		JWTSecret:    getEnv("JWT_SECRET", "prod-changer"),
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     smtpPort,
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		AppURL:       getEnv("APP_URL", "http://localhost:8081"),
	}
}
