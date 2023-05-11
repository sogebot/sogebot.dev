package main

import (
	"fmt"
	"log"
	"os"
	"services/webhooks/events"
	"sync"
	"time"

	"database/sql"

	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
)

var PG_USER_DB string = "eventsub_users"

func main() {
	fmt.Println("Starting up EventSub Webhooks service")

	var PG_PASSWORD string = os.Getenv("PG_PASSWORD")
	var PG_USERNAME string = os.Getenv("PG_USERNAME")
	var PG_DB string = os.Getenv("PG_DB")
	var PG_PORT string = os.Getenv("PG_PORT")
	var PG_HOST string = os.Getenv("PG_HOST")

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		PG_USERNAME, PG_PASSWORD, PG_HOST, PG_PORT, PG_DB,
	)
	// Connect to database
	db, err := sql.Open("postgres", connStr)
	status := db.Ping()
	if err != nil {
		log.Fatal(err)
	}
	if status != nil {
		log.Fatal(status)
	}
	fmt.Println("EventSub Webhooks service started")

	events.ListSubscriptions()
	// handleUsers(db, false)
}

func handleUsers(db *sql.DB, updatedOnly bool) {
	var rows *sql.Rows
	var err error

	if updatedOnly {
		rows, err = db.Query(
			fmt.Sprintf("SELECT * FROM %s WHERE updated=$1", PG_USER_DB), true,
		)
		if err != nil {
			log.Fatal(err)
		}
	} else {
		rows, err = db.Query(
			fmt.Sprintf("SELECT * FROM %s", PG_USER_DB),
		)
		if err != nil {
			log.Fatal(err)
		}
	}

	var (
		userId  string
		scopes  string
		updated bool
	)
	for rows.Next() {
		rows.Scan(&userId, &scopes, &updated)
		fmt.Println(userId, scopes, updated)

		var wg sync.WaitGroup

		wg.Add(2)

		// Create two goroutines for async tasks
		go events.ListenChannelFollow(&wg, userId, scopes)
		go events.ListenChannelFollow(&wg, userId, scopes)

		// Wait for all async tasks to complete
		wg.Wait()
	}

	time.Sleep(10 * time.Second)

	// run again after while
	handleUsers(db, true)
}
