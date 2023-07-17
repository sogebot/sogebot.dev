package main

import (
	"fmt"
	"log"
	"services/webhooks/commons"
	"services/webhooks/database"
	"services/webhooks/debug"
	"services/webhooks/handler"
	"services/webhooks/subscriptions"
	"strings"
	"sync"
	"time"

	"database/sql"

	_ "net/http/pprof"

	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
)

var PG_USER_DB string = "eventsub_users"

func main() {
	commons.Log("Starting up EventSub Webhooks service")
	database.Init()
	commons.Log("EventSub Webhooks service started")

	handler.Start()
	go handler.Loop()
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
		database.DB.Exec("UPDATE eventsub_users SET updated=$1", false)
	} else {
		rows, err = database.DB.Query(
			fmt.Sprintf("SELECT * FROM %s", PG_USER_DB),
		)
		if err != nil {
			log.Fatal(err)
		}
	}
	defer rows.Close()

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

		basic := map[string]interface{}{
			"broadcaster_user_id": userId,
		}

		subscriptionsMap := map[string][]struct {
			scope     string
			version   string
			condition map[string]interface{}
		}{
			"": {{
				scope:   "channel.raid",
				version: "1",
				condition: map[string]interface{}{
					"to_broadcaster_user_id": userId,
				},
			}},
			"moderator:read:followers": {{
				scope:   "channel.follow",
				version: "2",
				condition: map[string]interface{}{
					"broadcaster_user_id": userId,
					"moderator_user_id":   userId,
				},
			}},
			"channel:read:redemptions": {{
				scope:     "channel.channel_points_custom_reward_redemption.add",
				version:   "1",
				condition: basic,
			}},
			"bits:read": {{
				scope:     "channel.cheer",
				version:   "1",
				condition: basic,
			}},
			"channel:moderate": {{
				scope:     "channel.ban",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.unban",
				version:   "1",
				condition: basic,
			}},
			"channel:read:predictions": {{
				scope:     "channel.prediction.begin",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.prediction.progress",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.prediction.lock",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.prediction.end",
				version:   "1",
				condition: basic,
			}},
			"channel:read:polls": {{
				scope:     "channel.poll.begin",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.poll.progress",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.poll.end",
				version:   "1",
				condition: basic,
			}},
			"channel:read:hype_train": {{
				scope:     "channel.hype_train.begin",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.hype_train.progress",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.hype_train.end",
				version:   "1",
				condition: basic,
			}},
		}

		for scope, data := range subscriptionsMap {
			var wg sync.WaitGroup
			done := make(chan bool)
			if strings.Contains(scopes, scope) {
				for _, val := range data {
					wg.Add(1)
					go func(a struct {
						scope     string
						version   string
						condition map[string]interface{}
					}) {
						defer wg.Done()
						subscriptions.Create(userId, a.scope, a.version, a.condition)
						commons.Log("User " + userId + " subscribed for " + a.scope + ".v" + a.version)
						done <- true
					}(val)
				}
			}
		}
		time.Sleep(time.Second / 2)
	}

	time.Sleep(10 * time.Second)

	// run again after while
	handleUsers(true)
}
