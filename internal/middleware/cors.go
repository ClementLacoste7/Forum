package middleware

import (
	"context"
	"net/http"
)

// CORS adds headers to allow cross-origin requests
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// OptionalAuth routes GET to the get handler and other methods to the create handler.
// It injects user_id into context if a valid JWT is present, but does not block unauthenticated requests.
func OptionalAuth(get, create http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if userID, err := extractUserID(r); err == nil {
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			r = r.WithContext(ctx)
		}
		if r.Method == http.MethodGet {
			get(w, r)
		} else {
			create(w, r)
		}
	}
}
