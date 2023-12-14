package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"services/webhooks/commons"
	"time"
)

var DB *sql.DB // Package-level variable to hold the db connection

var noOfconnections int = 0

func Test() {
	for {
		if DB.Stats().OpenConnections != noOfconnections {
			if DB.Stats().OpenConnections > noOfconnections {
				fmt.Println("Connections Change: " + fmt.Sprint(DB.Stats().OpenConnections) + "(+" + fmt.Sprint(DB.Stats().OpenConnections-noOfconnections) + ")")
			} else {
				fmt.Println("Connections Change: " + fmt.Sprint(DB.Stats().OpenConnections) + "(" + fmt.Sprint(DB.Stats().OpenConnections-noOfconnections) + ")")
			}
			noOfconnections = DB.Stats().OpenConnections
		}
		time.Sleep(time.Second / 2)
	}
}

func Init() {
	var PG_PASSWORD string = os.Getenv("PG_PASSWORD")
	var PG_USERNAME string = os.Getenv("PG_USERNAME")
	var PG_DB string = os.Getenv("PG_DB")
	var PG_PORT string = os.Getenv("PG_PORT")
	var PG_HOST string = os.Getenv("PG_HOST")

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		PG_USERNAME, PG_PASSWORD, PG_HOST, PG_PORT, PG_DB,
	)
	// note to myself:
	// := cannot be used here as it creates new local variable, we need to use =
	var err error
	DB, err = sql.Open("postgres", connStr)

	DB.SetMaxOpenConns(10)
	DB.SetMaxIdleConns(2)

	status := DB.Ping()
	if err != nil {
		log.Fatal(err)
	}
	if status != nil {
		log.Fatal(status)
	}

	// clean events
	go clean()
	go reconnect(connStr)
	// go Test()
}

func reconnect(connStr string) {
	maxRetries := 10
	retryInterval := 5 * time.Second
	for i := 0; i < maxRetries; i++ {
		err := DB.Ping()
		if err != nil {
			commons.Log(fmt.Sprintf("Lost connection to the database. Retrying in %v...\n", retryInterval))
			time.Sleep(retryInterval)

			// Re-establish the connection
			DB, err = sql.Open("postgres", connStr)
			if err != nil {
				fmt.Println("Error reconnecting to the database:", err)
				continue
			}
		}

		time.Sleep(time.Second)
	}
}

func clean() {
	for {
		// clean events
		commons.Log("Cleaning 1 hour old events.")
		_, err := DB.Exec("DELETE FROM eventsub_events WHERE timestamp < NOW() - INTERVAL '1 hour'")
		if err != nil {
			commons.Log("Error cleaning events:" + err.Error())
		}

		time.Sleep(time.Hour)
	}
}
