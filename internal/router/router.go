package router

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"forum/internal/handlers"
	"forum/internal/middleware"

	"gorm.io/gorm"
)

func New(db *gorm.DB) http.Handler {
	h := handlers.New(db)
	mux := http.NewServeMux()

	// Static frontend + SPA fallback
	fileServer := http.FileServer(http.Dir("./frontend"))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}
		fullPath := filepath.Join("frontend", r.URL.Path[1:])
		if _, err := os.Stat(fullPath); os.IsNotExist(err) {
			http.ServeFile(w, r, "frontend/index.html")
			return
		}
		fileServer.ServeHTTP(w, r)
	})
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// Auth (public)
	mux.HandleFunc("/api/auth/register", h.Register)
	mux.HandleFunc("/api/auth/login", h.Login)
	mux.HandleFunc("/api/auth/refresh", h.Refresh)

	// Categories (public)
	mux.HandleFunc("/api/categories", h.GetCategories)

	// Passwords
	mux.HandleFunc("/api/auth/forgot-password", h.ForgotPassword)
	mux.HandleFunc("/api/auth/reset-password", h.ResetPassword)
	// Stats (public)
	mux.HandleFunc("/api/stats", h.GetStats)

	// Posts (mixte)
	mux.HandleFunc("/api/posts", middleware.OptionalAuth(h.GetPosts, h.CreatePost))
	mux.HandleFunc("/api/posts/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h.GetPost(w, r)
		case http.MethodPut:
			middleware.RequireAuth(h.UpdatePost)(w, r)
		case http.MethodDelete:
			middleware.RequireAuth(h.DeletePost)(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Comments
	mux.HandleFunc("/api/comments", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h.GetComments(w, r)
		case http.MethodPost:
			middleware.RequireAuth(h.CreateComment)(w, r)
		case http.MethodDelete:
			middleware.RequireAuth(h.DeleteComment)(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Likes (protégé)
	mux.HandleFunc("/api/likes", middleware.RequireAuth(h.ToggleLike))

	// Profile (protégé)
	mux.HandleFunc("/api/profile", middleware.RequireAuth(h.GetProfile))

	return middleware.CORS(mux)
}

mux.HandleFunc("/forgot-password", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "frontend/index.html")
})
mux.HandleFunc("/reset-password", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "frontend/index.html")
})