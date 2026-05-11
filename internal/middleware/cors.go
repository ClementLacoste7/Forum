package middleware

import (
	"context"
	"net/http"
)

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
