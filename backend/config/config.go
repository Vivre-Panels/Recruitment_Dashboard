package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost             string
	DBPort             string
	DBInstance         string
	DBName             string
	ServerPort         string
	DBUser             string
	DBPassword         string
	AuthTokenSecret    string
	AuthCookieSecure   bool
	AllowedOrigins     []string
	SuperadminEmail    string
	SuperadminPassword string
}

func Load() *Config {
	godotenv.Load("../.env")

	cfg := &Config{
		DBHost:             getEnv("DB_HOST", ""),
		DBPort:             getEnv("DB_PORT", "1433"),
		DBInstance:         getEnv("DB_SERVER", ""),
		DBName:             getEnv("DB_NAME", ""),
		ServerPort:         getEnv("SERVER_PORT", ""),
		DBUser:             getEnv("DB_USER", ""),
		DBPassword:         getEnv("DB_PASSWORD", ""),
		AuthTokenSecret:    getEnv("AUTH_TOKEN_SECRET", ""),
		AuthCookieSecure:   strings.EqualFold(strings.TrimSpace(getEnv("AUTH_COOKIE_SECURE", "false")), "true"),
		AllowedOrigins:     splitNonEmpty(getEnv("AUTH_ALLOWED_ORIGINS", "http://localhost:4200,http://127.0.0.1:4200")),
		SuperadminEmail:    strings.TrimSpace(getEnv("SUPERADMIN_EMAIL", "")),
		SuperadminPassword: getEnv("SUPERADMIN_PASSWORD", ""),
	}

	return cfg
}

func splitNonEmpty(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if value := strings.TrimRight(strings.TrimSpace(part), "/"); value != "" {
			result = append(result, value)
		}
	}
	return result
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
