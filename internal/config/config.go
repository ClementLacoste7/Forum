package config

type Config struct {
	Port         string
	DatabasePath string
	JWTSecret    string
}

func Load() *Config {
	return &Config{
		Port:         ":8081",
		DatabasePath: "./forum.db",
		JWTSecret:    "change-me-in-production",
	}
}
