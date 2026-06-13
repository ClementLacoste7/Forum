package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"forum/internal/middleware"
	"forum/internal/models"
)

func (h *Handler) CreateComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value(middleware.UserIDKey).(uint)

	var body struct {
		PostID  uint   `json:"post_id"`
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	body.Content = strings.TrimSpace(body.Content)
	if body.Content == "" {
		http.Error(w, "content is required", http.StatusBadRequest)
		return
	}
	if body.PostID == 0 {
		http.Error(w, "post_id is required", http.StatusBadRequest)
		return
	}

	// Check post exists
	var post models.Post
	if err := h.DB.First(&post, body.PostID).Error; err != nil {
		http.Error(w, "post not found", http.StatusNotFound)
		return
	}

	comment := models.Comment{Content: body.Content, UserID: userID, PostID: body.PostID}
	h.DB.Create(&comment)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(comment)
}

func (h *Handler) GetComments(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Query().Get("post_id")
	if postID == "" {
		http.Error(w, "missing post_id", http.StatusBadRequest)
		return
	}

	var comments []models.Comment
	h.DB.Preload("User").Where("post_id = ?", postID).Find(&comments)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

func (h *Handler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uint)
	if !ok || userID == 0 {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var body struct {
		CommentID uint `json:"comment_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	// Validate comment ID
	if body.CommentID == 0 {
		http.Error(w, "comment_id is required", http.StatusBadRequest)
		return
	}

	var comment models.Comment
	if err := h.DB.First(&comment, body.CommentID).Error; err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	// Only the author can delete
	if comment.UserID != userID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	h.DB.Delete(&comment)
	w.WriteHeader(http.StatusNoContent)
}
