package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

type Plugin struct {
	id          string
	name        string
	description string
	publisherId string
	publishedAt string
}

func homeLink(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	rows, err := db.Query("SELECT id, name, description, \"publisherId\", \"publishedAt\" FROM \"plugin\"")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	var (
		id          string
		name        string
		description string
		publisherId string
		publishedAt string
	)
	var data []Plugin
	for rows.Next() {
		rows.Scan(&id, &name, &description, &publisherId, &publishedAt)
		fmt.Printf("%s %s %s %s %s \n", id, name, description, publisherId, publishedAt)
		data = append(data, Plugin{
			id: id, name: name, description: description, publisherId: publisherId, publishedAt: publishedAt,
		})
	}
	fmt.Printf("%+v\n", data)

	for index := range data {
		fmt.Fprintf(w, data[index].name)
		fmt.Fprintf(w, data[index].description)
	}
	// fmt.Fprintf(w, "Welcome home!")
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
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		homeLink(w, r, db)
	})
	log.Fatal(http.ListenAndServe(":8081", router))
}
