package main

import (
	"encoding/json"
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
	handleUsers(false)
}

func handleUsers(updatedOnly bool) {
	var rows *sql.Rows
	var err error

	subscriptions.List()

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
			}, {
				scope:   "channel.raid",
				version: "1",
				condition: map[string]interface{}{
					"from_broadcaster_user_id": userId,
				},
			}, {
				scope:     "channel.update",
				version:   "2",
				condition: basic,
			}},
			"user:read:email": {{
				scope:   "user.update",
				version: "1",
				condition: map[string]interface{}{
					"user_id": userId,
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
			}, {
				scope:     "channel.channel_points_custom_reward_redemption.update",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.channel_points_custom_reward.add",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.channel_points_custom_reward.update",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.channel_points_custom_reward.remove",
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
			"channel:read:charity": {{
				scope:     "channel.charity_campaign.donate",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.charity_campaign.start",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.charity_campaign.progress",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.charity_campaign.stop",
				version:   "1",
				condition: basic,
			}},
			"channel:read:goals": {{
				scope:     "channel.goal.begin",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.goal.progress",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.goal.end",
				version:   "1",
				condition: basic,
			}},
			"moderation:read": {{
				scope:     "channel.moderator.add",
				version:   "1",
				condition: basic,
			}, {
				scope:     "channel.moderator.remove",
				version:   "1",
				condition: basic,
			}},
			"moderator:read:shield_mode": {{
				scope:   "channel.shield_mode.begin",
				version: "1",
				condition: map[string]interface{}{
					"broadcaster_user_id": userId,
					"moderator_user_id":   userId,
				},
			}, {
				scope:   "channel.shield_mode.end",
				version: "1",
				condition: map[string]interface{}{
					"broadcaster_user_id": userId,
					"moderator_user_id":   userId,
				},
			}},
			"channel.ad_break.begin": {{
				scope:     "channel:read:ads",
				version:   "1",
				condition: basic,
			}},
			"moderator:read:shoutouts": {{
				scope:   "channel.shoutout.create",
				version: "1",
				condition: map[string]interface{}{
					"broadcaster_user_id": userId,
					"moderator_user_id":   userId,
				},
			}, {
				scope:   "channel.shoutout.receive",
				version: "1",
				condition: map[string]interface{}{
					"broadcaster_user_id": userId,
					"moderator_user_id":   userId,
				},
			}},
		}

		for scope, data := range subscriptionsMap {
			var wg sync.WaitGroup
			if strings.Contains(scopes, scope) {
			OuterLoop:
				for _, val := range data {
					wg.Add(1)
					for _, item := range subscriptions.SubscriptionList {
						// condition to strings so we can check
						condition1, err := json.Marshal(val.condition)
						if err != nil {
							fmt.Println("Error marshaling map to JSON:", err)
							return
						}
						condition2, err := json.Marshal(item.Condition)
						if err != nil {
							fmt.Println("Error marshaling map to JSON:", err)
							return
						}
						// check if already subscribed
						if item.Type == val.scope && item.Version == val.version && string(condition2) == string(condition1) {
							// skip
							commons.Log("User " + userId + " already subscribed for " + val.scope + ".v" + val.version)
							continue OuterLoop
						}
					}
					go subscriptions.Create(&wg, userId, val.scope, val.version, val.condition)
				}
			}
		}
	}

	time.Sleep(10 * time.Second)

	// run again after while
	handleUsers(true)
}
