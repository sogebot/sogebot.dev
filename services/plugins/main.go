package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"reflect"
	"services/plugins/internal/middleware/auth"
	"services/plugins/routes"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gorilla/mux"
	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

var validate *validator.Validate

func main() {
	var PG_HOST, PG_PORT, PG_USERNAME, PG_PASSWORD, PG_DB string
	PG_HOST = os.Getenv("PG_HOST")
	if PG_HOST == "" {
		PG_HOST = "localhost"
	}
	PG_PORT = os.Getenv("PG_PORT")
	if PG_PORT == "" {
		PG_PORT = "5432"
	}
	PG_USERNAME = os.Getenv("PG_USERNAME")
	if PG_USERNAME == "" {
		PG_USERNAME = "postgres"
	}
	PG_PASSWORD = os.Getenv("PG_PASSWORD")
	if PG_PASSWORD == "" {
		PG_PASSWORD = "postgres"
	}
	PG_DB = os.Getenv("PG_DB")
	if PG_DB == "" {
		PG_DB = "sogebot"
	}

	connStr := fmt.Sprintf("postgresql://%s:%s@%s:%s/%s?sslmode=disable", PG_USERNAME, PG_PASSWORD, PG_HOST, PG_PORT, PG_DB)
	// Connect to database
	db, err := sql.Open("postgres", connStr)
	status := db.Ping()
	if err != nil {
		log.Fatal(err)
	}
	if status != nil {
		log.Fatal(status)
	}
	fmt.Println("Connected to database")

	validate = validator.New()
	validate.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})

	router := mux.NewRouter().StrictSlash(true)
	router.Use(auth.AuthMiddlewareWithLogger)
	router.HandleFunc("/plugins", func(w http.ResponseWriter, r *http.Request) {
		routes.GetPlugins(w, r, db)
	}).Methods(http.MethodGet)
	router.HandleFunc("/plugins", func(w http.ResponseWriter, r *http.Request) {
		routes.PostPlugin(w, r, db, validate)
	}).Methods(http.MethodPost)

	router.HandleFunc("/plugins/{id}/votes", func(w http.ResponseWriter, r *http.Request) {
		routes.PostPluginVote(w, r, db, validate)
	}).Methods(http.MethodPost)
	router.HandleFunc("/plugins/{id}/votes", func(w http.ResponseWriter, r *http.Request) {
		routes.DeletePluginVote(w, r, db)
	}).Methods(http.MethodDelete)

	router.HandleFunc("/plugins/{id}", func(w http.ResponseWriter, r *http.Request) {
		routes.GetPlugin(w, r, db)
	}).Methods(http.MethodGet)
	router.HandleFunc("/plugins/{id}", func(w http.ResponseWriter, r *http.Request) {
		routes.PutPlugin(w, r, db, validate)
	}).Methods(http.MethodPut)
	router.HandleFunc("/plugins/{id}", func(w http.ResponseWriter, r *http.Request) {
		routes.DeletePlugin(w, r, db)
	}).Methods(http.MethodDelete)

	// OVERLAYS
	router.HandleFunc("/overlays", func(w http.ResponseWriter, r *http.Request) {
		routes.GetOverlays(w, r, db)
	}).Methods(http.MethodGet)
	router.HandleFunc("/overlays", func(w http.ResponseWriter, r *http.Request) {
		routes.PostOverlay(w, r, db, validate)
	}).Methods(http.MethodPost)

	router.HandleFunc("/overlays/{id}/votes", func(w http.ResponseWriter, r *http.Request) {
		routes.PostOverlayVote(w, r, db, validate)
	}).Methods(http.MethodPost)
	router.HandleFunc("/overlays/{id}/votes", func(w http.ResponseWriter, r *http.Request) {
		routes.DeleteOverlayVote(w, r, db)
	}).Methods(http.MethodDelete)

	router.HandleFunc("/overlays/{id}", func(w http.ResponseWriter, r *http.Request) {
		routes.GetOverlay(w, r, db)
	}).Methods(http.MethodGet)
	router.HandleFunc("/overlays/{id}", func(w http.ResponseWriter, r *http.Request) {
		routes.PutOverlay(w, r, db, validate)
	}).Methods(http.MethodPut)
	router.HandleFunc("/overlays/{id}", func(w http.ResponseWriter, r *http.Request) {
		routes.DeleteOverlay(w, r, db)
	}).Methods(http.MethodDelete)

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"https://dash.sogebot.xyz", "http://localhost:3000", "http://localhost:3001"},
		AllowCredentials: true,
		AllowedHeaders:   []string{"Authorization", "content-type"},
	})
	handler := c.Handler(router)
	log.Fatal(http.ListenAndServe(":3000", handler))
}
