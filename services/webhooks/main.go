package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"services/webhooks/commons"
	"services/webhooks/database"
	"services/webhooks/debug"
	"services/webhooks/handler"
	"services/webhooks/subscriptions"
	"strconv"
	"strings"
	"sync"
	"time"

	"database/sql"

	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
	"golang.org/x/sync/semaphore"
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

var sem = semaphore.NewWeighted(int64(10))
var ctx = context.Background()

func handleUsers(updatedOnly bool) {
	var rows *sql.Rows
	var err error

	subscriptions.List()

	commons.Log("Currently subscribed to " + strconv.Itoa(len(subscriptions.SubscriptionList)) + " event(s)")

	// remove all subscriptions for users
	newSubscription = []NewSubscription{}

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
			event     string
			version   string
			condition map[string]interface{}
		}{
			"": {{
				event:   "channel.raid",
				version: "1",
				condition: map[string]interface{}{
					"to_broadcaster_user_id": userId,
				},
			}, {
				event:   "channel.raid",
				version: "1",
				condition: map[string]interface{}{
					"from_broadcaster_user_id": userId,
				},
			}, {
				event:     "channel.update",
				version:   "2",
				condition: basic,
			}},
			"user:read:email": {{
				event:   "user.update",
				version: "1",
				condition: map[string]interface{}{
					"user_id": userId,
				},
			}},
			"moderator:read:followers": {{
				event:   "channel.follow",
				version: "2",
				condition: map[string]interface{}{
					"broadcaster_user_id": userId,
					"moderator_user_id":   userId,
				},
			}},
			"channel:read:redemptions": {{
				event:     "channel.channel_points_custom_reward_redemption.add",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.channel_points_custom_reward_redemption.update",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.channel_points_custom_reward.add",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.channel_points_custom_reward.update",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.channel_points_custom_reward.remove",
				version:   "1",
				condition: basic,
			}},
			"bits:read": {{
				event:     "channel.cheer",
				version:   "1",
				condition: basic,
			}},
			"channel:moderate": {{
				event:     "channel.ban",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.unban",
				version:   "1",
				condition: basic,
			}},
			"channel:read:predictions": {{
				event:     "channel.prediction.begin",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.prediction.progress",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.prediction.lock",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.prediction.end",
				version:   "1",
				condition: basic,
			}},
			"channel:read:polls": {{
				event:     "channel.poll.begin",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.poll.progress",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.poll.end",
				version:   "1",
				condition: basic,
			}},
			"channel:read:hype_train": {{
				event:     "channel.hype_train.begin",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.hype_train.progress",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.hype_train.end",
				version:   "1",
				condition: basic,
			}},
			"channel:read:charity": {{
				event:     "channel.charity_campaign.donate",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.charity_campaign.start",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.charity_campaign.progress",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.charity_campaign.stop",
				version:   "1",
				condition: basic,
			}},
			"channel:read:goals": {{
				event:     "channel.goal.begin",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.goal.progress",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.goal.end",
				version:   "1",
				condition: basic,
			}},
			"moderation:read": {{
				event:     "channel.moderator.add",
				version:   "1",
				condition: basic,
			}, {
				event:     "channel.moderator.remove",
				version:   "1",
				condition: basic,
			}},
			"moderator:read:shield_mode": {{
				event:   "channel.shield_mode.begin",
				version: "1",
				condition: map[string]interface{}{
					"broadcaster_user_id": userId,
					"moderator_user_id":   userId,
				},
			}, {
				event:   "channel.shield_mode.end",
				version: "1",
				condition: map[string]interface{}{
					"broadcaster_user_id": userId,
					"moderator_user_id":   userId,
				},
			}},
			"channel:read:ads": {{
				event:     "channel.ad_break.begin",
				version:   "1",
				condition: basic,
			}},
			"moderator:read:shoutouts": {{
				event:   "channel.shoutout.create",
				version: "1",
				condition: map[string]interface{}{
					"broadcaster_user_id": userId,
					"moderator_user_id":   userId,
				},
			}, {
				event:   "channel.shoutout.receive",
				version: "1",
				condition: map[string]interface{}{
					"broadcaster_user_id": userId,
					"moderator_user_id":   userId,
				},
			}},
		}
		for scope, data := range subscriptionsMap {
			if strings.Contains(scopes, scope) {
			OuterLoop:
				for _, val := range data {
					for _, item := range subscriptions.SubscriptionList {
						condition1, err := json.Marshal(val.condition)
						if err != nil {
							fmt.Println("Error marshaling map to JSON:", err)
							return
						}
						// we need to remarshal the condition to objects to compare
						var conditionMarshalledDefined subscriptions.Condition
						err = json.Unmarshal(condition1, &conditionMarshalledDefined)
						if err != nil {
							fmt.Println("Error unmarshaling:", err)
							return
						}

						condition2, err := json.Marshal(item.Condition)
						if err != nil {
							fmt.Println("Error marshaling map to JSON:", err)
							return
						}
						// we need to remarshal the condition to objects to compare
						var conditionMarshalledReceived subscriptions.Condition
						err = json.Unmarshal(condition2, &conditionMarshalledReceived)
						if err != nil {
							fmt.Println("Error unmarshaling:", err)
							return
						}

						// check if already subscribed
						if item.Type == val.event && item.Version == val.version && conditionMarshalledDefined.Equal(&conditionMarshalledReceived) {
							// skip
							// commons.Log("User " + userId + " already subscribed for " + val.scope + ".v" + val.version)
							// continue on outer loop to next subscription
							continue OuterLoop
						}
					}

					// not found in loop, add to newSubscription
					commons.Log("User " + userId + " added to new subscription list " + val.event + ".v" + val.version)
					newSubscription = append(newSubscription, NewSubscription{
						userId:    userId,
						event:     val.event,
						version:   val.version,
						condition: val.condition,
					})
				}
			}
		}
	}

	// subscribe all users in newSubscription
	subscribe()

	time.Sleep(time.Minute)

	// run again after while
	handleUsers(true)
}

type NewSubscription struct {
	userId    string
	event     string
	version   string
	condition interface{}
}

var newSubscription []NewSubscription

func subscribe() {
	var wg sync.WaitGroup

	commons.Log("Subscribing " + strconv.Itoa(len(newSubscription)) + " user(s) to new events")

	for len(newSubscription) > 0 {
		// commons.Log("Subscribing user " + val.userId + " for " + val.scope + ".v" + val.version)
		val := newSubscription[len(newSubscription)-1]
		// Update the slice to remove the last element
		newSubscription = newSubscription[:len(newSubscription)-1]
		sem.Acquire(ctx, 1)
		go func() {
			// commons.Log("Releasing semaphore for " + val.userId + " " + val.scope + ".v" + val.version)
			time.Sleep(time.Second / 2)
			sem.Release(1)
		}()
		wg.Add(1)
		go subscriptions.Create(&wg, val.userId, val.event, val.version, val.condition)
	}
}
