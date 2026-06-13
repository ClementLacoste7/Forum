package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"forum/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/gomail.v2"
)

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	body.Username = strings.TrimSpace(body.Username)
	body.Email = strings.TrimSpace(body.Email)
	body.Password = strings.TrimSpace(body.Password)

	if body.Username == "" || body.Email == "" || body.Password == "" {
		http.Error(w, "all fields are required", http.StatusBadRequest)
		return
	}
	if len(body.Password) < 6 {
		http.Error(w, "password must be at least 6 characters", http.StatusBadRequest)
		return
	}
	if !strings.Contains(body.Email, "@") {
		http.Error(w, "invalid email address", http.StatusBadRequest)
		return
	}

	// Hash password before storing
	hashed, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "server error", http.StatusInternalServerError)
		return
	}

	user := models.User{
		Username: body.Username,
		Email:    body.Email,
		Password: string(hashed),
	}

	if err := h.DB.Create(&user).Error; err != nil {
		http.Error(w, "email or username already taken", http.StatusConflict)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "user created"})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	body.Email = strings.TrimSpace(body.Email)
	body.Password = strings.TrimSpace(body.Password)

	if body.Email == "" || body.Password == "" {
		http.Error(w, "email and password are required", http.StatusBadRequest)
		return
	}

	// Find user by email
	var user models.User
	if err := h.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	// Compare hashed password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	// Access token expires in 15 minutes
	access := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(15 * time.Minute).Unix(),
	})
	accessToken, _ := access.SignedString([]byte(h.Config.JWTSecret))

	// Refresh token expires in 7 days
	refresh := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
	})
	refreshToken, _ := refresh.SignedString([]byte(h.Config.JWTSecret))

	// Store refresh token in DB
	h.DB.Model(&user).Update("refresh_token", refreshToken)

	json.NewEncoder(w).Encode(map[string]string{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(body.RefreshToken) == "" {
		http.Error(w, "refresh token is required", http.StatusBadRequest)
		return
	}

	// Validate refresh token signature
	token, err := jwt.Parse(body.RefreshToken, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, http.ErrNoCookie
		}
		return []byte(h.Config.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		http.Error(w, "invalid refresh token", http.StatusUnauthorized)
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	userID := uint(claims["user_id"].(float64))

	// Check token exists in DB (invalidation check)
	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	if user.RefreshToken != body.RefreshToken {
		http.Error(w, "refresh token revoked", http.StatusUnauthorized)
		return
	}

	// Issue new access token
	access := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(15 * time.Minute).Unix(),
	})
	accessToken, _ := access.SignedString([]byte(h.Config.JWTSecret))

	json.NewEncoder(w).Encode(map[string]string{
		"access_token": accessToken,
	})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	// Invalidate refresh token in DB
	h.DB.Model(&models.User{}).Where("refresh_token = ?", body.RefreshToken).Update("refresh_token", "")

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	// Validate email
	body.Email = strings.TrimSpace(body.Email)
	if body.Email == "" || !strings.Contains(body.Email, "@") {
		http.Error(w, "valid email is required", http.StatusBadRequest)
		return
	}

	var user models.User
	if err := h.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "email sent if account exists"})
		return
	}

	// Generate random reset token
	tokenBytes := make([]byte, 16)
	rand.Read(tokenBytes)
	resetToken := hex.EncodeToString(tokenBytes)

	// Store token with 1 hour expiry
	h.DB.Model(&user).Updates(map[string]interface{}{
		"reset_token":        resetToken,
		"reset_token_expiry": time.Now().Add(1 * time.Hour),
	})

	// Send reset email
	resetLink := h.Config.AppURL + "/reset-password?token=" + resetToken
	m := gomail.NewMessage()
	m.SetHeader("From", h.Config.SMTPUser)
	m.SetHeader("To", user.Email)
	m.SetHeader("Subject", "Password reset")
	m.SetBody("text/html", `
		<p>Hi `+user.Username+`,</p>
		<p>Click the link below to reset your password:</p>
		<a href="`+resetLink+`">`+resetLink+`</a>
		<p>This link expires in 1 hour.</p>
	`)

	d := gomail.NewDialer(h.Config.SMTPHost, h.Config.SMTPPort, h.Config.SMTPUser, h.Config.SMTPPassword)
	if err := d.DialAndSend(m); err != nil {
		http.Error(w, "error sending email", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "email sent if account exists"})
}

func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	// Validate fields
	body.Token = strings.TrimSpace(body.Token)
	body.Password = strings.TrimSpace(body.Password)

	if body.Token == "" || body.Password == "" {
		http.Error(w, "token and password are required", http.StatusBadRequest)
		return
	}
	if len(body.Password) < 6 {
		http.Error(w, "password must be at least 6 characters", http.StatusBadRequest)
		return
	}

	var user models.User
	if err := h.DB.Where("reset_token = ?", body.Token).First(&user).Error; err != nil {
		http.Error(w, "invalid token", http.StatusBadRequest)
		return
	}

	// Check token expiry
	if time.Now().After(user.ResetTokenExpiry) {
		http.Error(w, "token expired", http.StatusBadRequest)
		return
	}

	// Hash new password
	hashed, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "server error", http.StatusInternalServerError)
		return
	}

	// Update password and clear reset token
	h.DB.Model(&user).Updates(map[string]interface{}{
		"password":           string(hashed),
		"reset_token":        "",
		"reset_token_expiry": time.Time{},
	})

	json.NewEncoder(w).Encode(map[string]string{"message": "password updated"})
}
