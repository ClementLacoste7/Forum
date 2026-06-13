package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"forum/internal/middleware"
	"forum/internal/models"
)

func (h *Handler) GetPosts(w http.ResponseWriter, r *http.Request) {
	posts := []models.Post{}
	h.DB.Preload("User").Preload("Categories").Preload("Comments").Preload("Likes").Find(&posts)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func (h *Handler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok || userID == 0 {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse multipart form (max 20MB)
	if err := r.ParseMultipartForm(20 << 20); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	title := strings.TrimSpace(r.FormValue("title"))
	content := strings.TrimSpace(r.FormValue("content"))
	categoryNames := r.Form["categories"]

	// Validate required fields
	if title == "" {
		http.Error(w, "title is required", http.StatusBadRequest)
		return
	}
	if content == "" {
		http.Error(w, "content is required", http.StatusBadRequest)
		return
	}
	if len(categoryNames) == 0 {
		http.Error(w, "at least one category is required", http.StatusBadRequest)
		return
	}

	// Only allow existing categories
	var categories []models.Category
	for _, name := range categoryNames {
		var cat models.Category
		if err := h.DB.Where("name = ?", name).First(&cat).Error; err != nil {
			http.Error(w, "invalid category: "+name, http.StatusBadRequest)
			return
		}
		categories = append(categories, cat)
	}

	// Handle image upload
	var imagePath string
	file, header, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		ext := filepath.Ext(header.Filename)
		allowed := map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".gif": true}
		if !allowed[strings.ToLower(ext)] {
			http.Error(w, "invalid image format", http.StatusBadRequest)
			return
		}
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		dst, err := os.Create("uploads/" + filename)
		if err != nil {
			http.Error(w, "failed to save image", http.StatusInternalServerError)
			return
		}
		defer dst.Close()
		io.Copy(dst, file)
		imagePath = "/uploads/" + filename
	}

	post := models.Post{
		Title:      title,
		Content:    content,
		UserID:     userID,
		Categories: categories,
		ImagePath:  imagePath,
	}
	h.DB.Create(&post)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func (h *Handler) GetPost(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/posts/")
	var post models.Post
	if err := h.DB.Preload("User").Preload("Comments.User").Preload("Categories").First(&post, id).Error; err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

func (h *Handler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok || userID == 0 {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	idStr := strings.TrimSpace(strings.TrimPrefix(r.URL.Path, "/api/posts/"))
	var post models.Post
	if err := h.DB.Preload("Categories").Where("id = ?", idStr).First(&post).Error; err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	// Only the author can edit
	if post.UserID != userID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	// Parse multipart form (max 20MB)
	if err := r.ParseMultipartForm(20 << 20); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	title := strings.TrimSpace(r.FormValue("title"))
	content := strings.TrimSpace(r.FormValue("content"))
	categoryNames := r.Form["categories"]

	// Validate required fields
	if title == "" {
		http.Error(w, "title is required", http.StatusBadRequest)
		return
	}
	if content == "" {
		http.Error(w, "content is required", http.StatusBadRequest)
		return
	}
	if len(categoryNames) == 0 {
		http.Error(w, "at least one category is required", http.StatusBadRequest)
		return
	}

	// Only allow existing categories
	var categories []models.Category
	for _, name := range categoryNames {
		var cat models.Category
		if err := h.DB.Where("name = ?", name).First(&cat).Error; err != nil {
			http.Error(w, "invalid category: "+name, http.StatusBadRequest)
			return
		}
		categories = append(categories, cat)
	}

	// Handle new image upload if provided
	file, header, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		ext := filepath.Ext(header.Filename)
		allowed := map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".gif": true}
		if !allowed[strings.ToLower(ext)] {
			http.Error(w, "invalid image format", http.StatusBadRequest)
			return
		}
		// Delete old image if exists
		if post.ImagePath != "" {
			os.Remove("." + post.ImagePath)
		}
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		dst, err := os.Create("uploads/" + filename)
		if err != nil {
			http.Error(w, "failed to save image", http.StatusInternalServerError)
			return
		}
		defer dst.Close()
		io.Copy(dst, file)
		post.ImagePath = "/uploads/" + filename
	}

	h.DB.Model(&post).Association("Categories").Replace(categories)
	h.DB.Model(&post).Updates(map[string]interface{}{
		"title":      title,
		"content":    content,
		"image_path": post.ImagePath,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

func (h *Handler) DeletePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok || userID == 0 {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	idStr := strings.TrimSpace(strings.TrimPrefix(r.URL.Path, "/api/posts/"))
	var post models.Post
	if err := h.DB.Where("id = ?", idStr).First(&post).Error; err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	// Only the author can delete
	if post.UserID != userID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	// Delete image file if exists
	if post.ImagePath != "" {
		os.Remove("." + post.ImagePath)
	}

	h.DB.Delete(&post)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) GetCategories(w http.ResponseWriter, r *http.Request) {
	var categories []models.Category
	h.DB.Find(&categories)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	var postCount int64
	var memberCount int64
	h.DB.Model(&models.Post{}).Count(&postCount)
	h.DB.Model(&models.User{}).Count(&memberCount)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int64{
		"posts":   postCount,
		"members": memberCount,
	})
}
