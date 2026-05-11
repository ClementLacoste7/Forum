package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"forum/internal/middleware"
	"forum/internal/models"
)

func (h *Handler) GetPosts(w http.ResponseWriter, r *http.Request) {
	posts := []models.Post{}
	h.DB.Preload("User").Preload("Categories").Find(&posts)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func (h *Handler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok || userID == 0 {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var body struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	post := models.Post{Title: body.Title, Content: body.Content, UserID: userID}
	h.DB.Create(&post)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func (h *Handler) GetPost(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/posts/")
	var post models.Post
	if err := h.DB.Preload("User").Preload("Comments.User").First(&post, id).Error; err != nil {
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

	id := strings.TrimPrefix(r.URL.Path, "/api/posts/")
	var post models.Post
	if err := h.DB.First(&post, id).Error; err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if post.UserID != userID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	var body struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	h.DB.Model(&post).Updates(models.Post{Title: body.Title, Content: body.Content})
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}
func (h *Handler) DeletePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok || userID == 0 {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/posts/")
	var post models.Post
	if err := h.DB.First(&post, id).Error; err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	// Only the author can delete
	if post.UserID != userID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	h.DB.Delete(&post)
	w.WriteHeader(http.StatusNoContent)
}
