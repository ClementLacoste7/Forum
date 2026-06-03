package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username           string     `gorm:"uniqueIndex;not null"`
	Email              string     `gorm:"uniqueIndex;not null"`
	Password           string     `gorm:"not null"`
	Avatar             string
	ResetToken         string
	ResetTokenExpiry   time.Time
	Posts              []Post    `gorm:"foreignKey:UserID"`
	Comments           []Comment `gorm:"foreignKey:UserID"`
	Likes              []Like    `gorm:"foreignKey:UserID"`
}