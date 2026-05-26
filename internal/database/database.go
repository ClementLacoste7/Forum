package database

import (
	"forum/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var defaultCategories = []string{
	"Sport", "Tech", "Gaming", "Musique",
	"Cinéma", "Politique", "Humour", "Autre",
}

func Init(path string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.Post{},
		&models.Comment{},
		&models.Like{},
		&models.Category{},
	)
	if err != nil {
		return nil, err
	}

	// Seed default categories if they don't exist
	for _, name := range defaultCategories {
		db.FirstOrCreate(&models.Category{}, models.Category{Name: name})
	}

	return db, nil
}
