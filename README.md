# Hidden Talks

A full-stack forum web application built with Go and vanilla JavaScript.

## Tech Stack

Backend: Go with GORM (SQLite)
Frontend: HTML, CSS, JavaScript (SPA)
Auth: JWT (access token + refresh token)
Editor: Quill.js

## Project Structure

Forum/
├── frontend/
│ ├── assets/
│ └── js/
├── internal/
│ ├── config/
│ ├── database/
│ ├── handlers/
│ ├── middleware/
│ ├── models/
│ └── router/
├── uploads/
└── main.go

## Features

User registration and login with JWT
Math captcha on registration
Password reset via email
Create and delete posts with rich text editor
Image attachments on posts (PNG, JPEG, GIF, max 20MB)
Post categories with filtering
Comments on posts
Like and dislike posts
User profile page with activity history

## How to run

Clone the repository
Copy `internal/config/config.example.go` to `internal/config/config.go` and fill in your SMTP credentials
Install dependencies: `go mod tidy`
Run the server: `go run main.go`
Open `http://localhost:8081` in your browser

## Database

SQLite database is auto-created at `forum.db` on first launch. Migrations are handled automatically by GORM AutoMigrate on startup.
