package models

type Category struct {
	ID    uint   `gorm:"primaryKey"`
	Name  string `gorm:"uniqueIndex;not null"`
	Posts []Post `gorm:"many2many:post_categories"`
}
