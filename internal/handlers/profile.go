package handlers

import (
	"encoding/json"
	"net/http"

	"forum/internal/middleware"
	"forum/internal/models"
)

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(uint)

	var user models.User
	if err := h.DB.Preload("Posts").First(&user, userID).Error; err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	user.Password = ""
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
