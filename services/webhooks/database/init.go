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
	status := DB.Ping()
	if err != nil {
		log.Fatal(err)
	}
	if status != nil {
		log.Fatal(status)
	}

	// clean events
	go clean()
	go Test()
}

func clean() {
	for {
		// clean events
		commons.Log("Cleaning 2 weeks old events.")
		_, err := DB.Exec("DELETE FROM eventsub_events WHERE timestamp < NOW() - INTERVAL '2 weeks'")
		if err != nil {
			commons.Log("Error cleaning events:" + err.Error())
		}

		time.Sleep(7 * 24 * time.Hour) // Sleep for 1 week
	}
}
