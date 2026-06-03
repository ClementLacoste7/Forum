package handlers

import (
	"encoding/json"
	"net/http"

	"forum/internal/middleware"
	"forum/internal/models"
)

func (h *Handler) GetLikes(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Query().Get("post_id")
	if postID == "" {
		http.Error(w, "missing post_id", http.StatusBadRequest)
		return
	}

	var likes []models.Like
	h.DB.Where("post_id = ?", postID).Find(&likes)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(likes)
}

func (h *Handler) ToggleLike(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value(middleware.UserIDKey).(uint)

	var body struct {
		PostID uint `json:"post_id"`
		IsLike bool `json:"is_like"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	var like models.Like
	result := h.DB.Where("user_id = ? AND post_id = ?", userID, body.PostID).First(&like)
	if result.Error != nil {
		like = models.Like{UserID: userID, PostID: body.PostID, IsLike: body.IsLike}
		h.DB.Create(&like)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(like)
		return
	}
	if like.IsLike == body.IsLike {
		h.DB.Delete(&like)
		w.WriteHeader(http.StatusNoContent)
		return
	}
	h.DB.Model(&like).Update("is_like", body.IsLike)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(like)
}
