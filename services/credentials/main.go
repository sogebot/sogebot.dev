package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"services/credentials/authenticators"
	"services/credentials/commons"

	"github.com/go-chi/httprate"
	"github.com/gorilla/mux"
	_ "github.com/joho/godotenv/autoload"
	"github.com/rs/cors"
)

func main() {
	router := mux.NewRouter().StrictSlash(true)
	router.Use(commons.Logger)
	router.Use(httprate.Limit(
		10,          // requests
		time.Minute, // per duration
		httprate.WithKeyFuncs(httprate.KeyByIP, httprate.KeyByEndpoint),
	))
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, "This is not an endpoint you are looking for.")
	}).Methods(http.MethodGet)

	router.HandleFunc("/google", func(w http.ResponseWriter, r *http.Request) {
		authenticators.Google(w, r)
	}).Methods(http.MethodGet)
	router.HandleFunc("/google", func(w http.ResponseWriter, r *http.Request) {
		authenticators.GoogleRefresh(w, r)
	}).Methods(http.MethodPost)

	router.HandleFunc("/donationalerts", func(w http.ResponseWriter, r *http.Request) {
		authenticators.DonationAlerts(w, r)
	}).Methods(http.MethodGet)
	router.HandleFunc("/donationalerts", func(w http.ResponseWriter, r *http.Request) {
		authenticators.DonationAlertsRefresh(w, r)
	}).Methods(http.MethodPost)

	router.HandleFunc("/twitch", func(w http.ResponseWriter, r *http.Request) {
		authenticators.Twitch(w, r)
	}).Methods(http.MethodGet)
	router.HandleFunc("/twitch/refresh/{token}", func(w http.ResponseWriter, r *http.Request) {
		authenticators.TwitchRefresh(w, r)
	}).Methods(http.MethodPost)

	router.HandleFunc("/streamlabs", func(w http.ResponseWriter, r *http.Request) {
		authenticators.Streamlabs(w, r)
	}).Methods(http.MethodGet)

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"https://dash.sogebot.xyz", "http://localhost:3000", "http://localhost:3001"},
		AllowCredentials: true,
		AllowedHeaders:   []string{"Authorization", "content-type"},
	})
	handler := c.Handler(router)
	log.Println("Credentials service started")
	log.Fatal(http.ListenAndServe(":3000", handler))
}
