package router

import (
	"net/http"

	"forum/internal/handlers"
	"forum/internal/middleware"

	"gorm.io/gorm"
)

func New(db *gorm.DB) http.Handler {
	h := handlers.New(db)
	mux := http.NewServeMux()

	// Static frontend
	mux.Handle("/", http.FileServer(http.Dir("./frontend")))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// Auth (public)
	mux.HandleFunc("/api/auth/register", h.Register)
	mux.HandleFunc("/api/auth/login", h.Login)
	mux.HandleFunc("/api/auth/refresh", h.Refresh)

	// Posts (mixte)
	mux.HandleFunc("/api/posts", middleware.OptionalAuth(h.GetPosts, h.CreatePost))
	mux.HandleFunc("/api/posts/", middleware.OptionalAuth(h.GetPost, h.UpdatePost))

	// Comments (protégé)
	mux.HandleFunc("/api/comments", middleware.RequireAuth(h.CreateComment))

	// Likes (protégé)
	mux.HandleFunc("/api/likes", middleware.RequireAuth(h.ToggleLike))

	// Profile (protégé)
	mux.HandleFunc("/api/profile", middleware.RequireAuth(h.GetProfile))

	return mux
}
