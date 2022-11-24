package main

import (
	"log"
	"net/http"

	"services/credentials/authenticators"
	"services/credentials/commons"

	"github.com/gorilla/mux"
	_ "github.com/joho/godotenv/autoload"
	"github.com/rs/cors"
)

func main() {
	router := mux.NewRouter().StrictSlash(true)
	router.Use(commons.Logger)
	router.HandleFunc("/google", func(w http.ResponseWriter, r *http.Request) {
		authenticators.Google(w, r)
	}).Methods(http.MethodGet)
	router.HandleFunc("/google", func(w http.ResponseWriter, r *http.Request) {
		authenticators.GoogleRefresh(w, r)
	}).Methods(http.MethodPost)

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"https://dash.sogebot.xyz", "http://localhost:3000"},
		AllowCredentials: true,
		AllowedHeaders:   []string{"Authorization", "content-type"},
	})
	handler := c.Handler(router)
	log.Println("Credentials service started")
	log.Fatal(http.ListenAndServe(":3000", handler))
}
