package database

import (
	"fmt"
	"time"

	"forum/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var defaultCategories = []string{
	"Confessions", "Hot Takes", "Relationships", "Drama",
	"Glow Up", "Red Flags", "Girl Talk", "Tea Time",
	"Dating Advice", "Body & Mind", "Career & Adulting",
	"Friendships", "Fashion & Style", "Life Advice",
}

// Migration represents a migration entry in the database
type Migration struct {
	ID        uint      `gorm:"primaryKey"`
	Name      string    `gorm:"uniqueIndex;not null"`
	AppliedAt time.Time `gorm:"not null"`
}

// runMigration runs a named migration if it hasn't been applied yet
func runMigration(db *gorm.DB, name string, fn func(*gorm.DB) error) error {
	var existing Migration
	if err := db.Where("name = ?", name).First(&existing).Error; err == nil {
		return nil
	}

	if err := fn(db); err != nil {
		return fmt.Errorf("migration %s failed: %w", name, err)
	}

	db.Create(&Migration{Name: name, AppliedAt: time.Now()})
	fmt.Printf("[migration] applied: %s\n", name)
	return nil
}

func Init(path string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Create migrations table first
	if err := db.AutoMigrate(&Migration{}); err != nil {
		return nil, err
	}

	// Run tracked migrations
	migrations := []struct {
		name string
		fn   func(*gorm.DB) error
	}{
		{
			"create_users_table",
			func(db *gorm.DB) error { return db.AutoMigrate(&models.User{}) },
		},
		{
			"create_posts_table",
			func(db *gorm.DB) error { return db.AutoMigrate(&models.Post{}) },
		},
		{
			"create_comments_table",
			func(db *gorm.DB) error { return db.AutoMigrate(&models.Comment{}) },
		},
		{
			"create_likes_table",
			func(db *gorm.DB) error { return db.AutoMigrate(&models.Like{}) },
		},
		{
			"create_categories_table",
			func(db *gorm.DB) error { return db.AutoMigrate(&models.Category{}) },
		},
		{
			"add_reset_token_to_users",
			func(db *gorm.DB) error { return db.AutoMigrate(&models.User{}) },
		},
		{
			"add_refresh_token_to_users",
			func(db *gorm.DB) error { return db.AutoMigrate(&models.User{}) },
		},
		{
			"add_image_path_to_posts",
			func(db *gorm.DB) error { return db.AutoMigrate(&models.Post{}) },
		},
		{
			"update_categories_hidden_talks",
			func(db *gorm.DB) error {
				return db.Exec("DELETE FROM categories").Error
			},
		},
	}

	for _, m := range migrations {
		if err := runMigration(db, m.name, m.fn); err != nil {
			return nil, err
		}
	}

	// Seed default categories if they don't exist
	for _, name := range defaultCategories {
		db.FirstOrCreate(&models.Category{}, models.Category{Name: name})
	}

	return db, nil
}
