package handlers

import (
	"forum/internal/config"

	"gorm.io/gorm"
)

type Handler struct {
	DB     *gorm.DB
	Config *config.Config
}

func New(db *gorm.DB) *Handler {
	return &Handler{DB: db, Config: config.Load()}
}
