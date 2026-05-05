package models

import "gorm.io/gorm"

type Post struct {
	gorm.Model
	Title      string `gorm:"not null"`
	Content    string `gorm:"not null"`
	ImagePath  string
	UserID     uint
	User       User       `gorm:"foreignKey:UserID"`
	Categories []Category `gorm:"many2many:post_categories"`
	Comments   []Comment  `gorm:"foreignKey:PostID"`
	Likes      []Like     `gorm:"foreignKey:PostID"`
}
