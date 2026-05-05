package main

import (
	"fmt"
	"log"
	"net/http"

	"forum/internal/config"
	"forum/internal/database"
	"forum/internal/router"
)

func main() {
	cfg := config.Load()

	db, err := database.Init(cfg.DatabasePath)
	if err != nil {
		log.Fatal("DB init failed:", err)
	}

	r := router.New(db)

	fmt.Printf("Server running on http://localhost%s\n", cfg.Port)
	log.Fatal(http.ListenAndServe(cfg.Port, r))
}
