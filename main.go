package main

import (
	"fmt"
	"log"
	"net/http"

	"forum/internal/config"
	"forum/internal/database"
	"forum/internal/router"
)

// startServer launches the HTTP server in a goroutine and signals readiness on the ready channel
func startServer(port string, handler http.Handler, ready chan<- bool) {
	server := &http.Server{
		Addr:    port,
		Handler: handler,
	}

	ready <- true

	if err := server.ListenAndServe(); err != nil {
		log.Fatal("Server error:", err)
	}
}

func main() {
	cfg := config.Load()

	db, err := database.Init(cfg.DatabasePath)
	if err != nil {
		log.Fatal("DB init failed:", err)
	}

	r := router.New(db)

	// Channel to signal when server is ready
	ready := make(chan bool, 1)

	go startServer(cfg.Port, r, ready)

	// Wait for server to be ready before logging
	<-ready
	fmt.Printf("Server running on http://localhost%s\n", cfg.Port)

	// Block main goroutine
	select {}
}
