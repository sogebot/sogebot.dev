package main

import (
	"fmt"
	"log"
	"services/webhooks/commons"
	"services/webhooks/database"
	"services/webhooks/debug"
	"services/webhooks/handler"
	"services/webhooks/subscriptions"
	"sync"
	"time"

	"database/sql"

	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
)

var PG_USER_DB string = "eventsub_users"

func main() {
	commons.Log("Starting up EventSub Webhooks service")
	database.Init()
	commons.Log("EventSub Webhooks service started")

	handler.Start()
	subscriptions.List(nil)
	handleUsers(false)
}

func handleUsers(updatedOnly bool) {
	var rows *sql.Rows
	var err error

	if updatedOnly {
		rows, err = database.DB.Query(
			fmt.Sprintf("SELECT * FROM %s WHERE updated=$1", PG_USER_DB), true,
		)
		if err != nil {
			log.Fatal(err)
		}
	} else {
		rows, err = database.DB.Query(
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

		if debug.IsDEV() {
			if userId != "96965261" {
				continue
			}
		}

		var wg sync.WaitGroup

		wg.Add(1)

		go subscriptions.Create(&wg, userId, "channel.channel_points_custom_reward_redemption.add", "1", map[string]interface{}{
			"broadcaster_user_id": userId,
		})

		// Wait for all async tasks to complete
		wg.Wait()
	}

	time.Sleep(10 * time.Second)

	// run again after while
	handleUsers(true)
}
