package config

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

func Load() *Config {
	return &Config{
		Port:         ":8081",
		DatabasePath: "./forum.db",
		JWTSecret:    "change-me-in-production",
		SMTPHost:     "smtp.gmail.com",
		SMTPPort:     587,
		SMTPUser:     "clement.lacoste64@gmail.com",
		SMTPPassword: "bemh mdmm xhvl yamc",
		AppURL:       "http://localhost:8081",
	}
}
