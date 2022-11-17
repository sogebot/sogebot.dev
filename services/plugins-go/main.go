package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"services/plugins/internal/middleware/auth"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

type Plugin struct {
	Id             string       `json:"id"`
	Name           string       `json:"name"`
	Description    string       `json:"description"`
	PublisherId    string       `json:"publisherId"`
	PublishedAt    string       `json:"publishedAt"`
	Version        int          `json:"version"`
	Plugin         string       `json:"plugin"`
	ImportedCount  int          `json:"importedCount"`
	CompatibleWith string       `json:"compatibleWith"`
	Votes          []PluginVote `json:"votes"`
}

type PluginVote struct {
	Id     string `json:"id"`
	UserId string `json:"userId"`
	Vote   int    `json:"vote"`
}

func homeLink(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	rows, err := db.Query(`
		SELECT   P.*, COALESCE(json_agg(C) FILTER (WHERE C."userId" IS NOT NULL), '[]') AS votes
			FROM        "plugin" P
			LEFT JOIN  "plugin_vote"  C
					ON      C."pluginId" = P."id"
			GROUP BY P."id"
	`)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	var (
		id             string
		name           string
		description    string
		publisherId    string
		publishedAt    string
		version        int
		plugin         string
		importedCount  int
		compatibleWith string
		votesJSON      string

		data []Plugin
	)
	for rows.Next() {
		rows.Scan(&id, &name, &description, &publisherId, &publishedAt, &version, &plugin, &importedCount, &compatibleWith, &votesJSON)

		// unmarshal votes
		votes := []PluginVote{}
		json.Unmarshal([]byte(votesJSON), &votes)

		data = append(data, Plugin{
			Id: id, Name: name, Description: description, PublisherId: publisherId, PublishedAt: publishedAt, Version: version, Plugin: plugin, ImportedCount: importedCount, CompatibleWith: compatibleWith, Votes: votes,
		})
	}

	if f, err := json.Marshal(data); err != nil {
		log.Fatal(err)
	} else {
		w.Header().Add("content-type", "application/json")
		w.WriteHeader(200)
		fmt.Fprint(w, string(f))
	}
}

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

	router := mux.NewRouter().StrictSlash(true)
	router.Use(auth.AuthMiddlewareWithLogger)
	router.HandleFunc("/plugins", func(w http.ResponseWriter, r *http.Request) {
		homeLink(w, r, db)
	})
	log.Fatal(http.ListenAndServe(":3000", router))
}
