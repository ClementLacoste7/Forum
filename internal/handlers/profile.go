package handlers

import (
	"encoding/json"
	"net/http"

	"forum/internal/middleware"
	"forum/internal/models"
)

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(uint)

	// Load user with all activity
	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	var posts []models.Post
	h.DB.Where("user_id = ?", userID).Find(&posts)

	var comments []models.Comment
	h.DB.Preload("Post").Where("user_id = ?", userID).Find(&comments)

	var likes []models.Like
	h.DB.Where("user_id = ?", userID).Find(&likes)

	// Never expose hashed password
	user.Password = ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user":     user,
		"posts":    posts,
		"comments": comments,
		"likes":    likes,
	})
}
