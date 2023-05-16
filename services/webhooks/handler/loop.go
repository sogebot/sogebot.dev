package handler

import (
	"services/webhooks/commons"
	"services/webhooks/database"
	"sync"
	"time"
)

var Events map[string]struct {
	timestamp time.Time
	data      string
}

var mutex = &sync.RWMutex{}

func Loop() {
	Events = make(map[string]struct {
		timestamp time.Time
		data      string
	})
	for {
		mutex.Lock()
		for userId := range Events {
			if userId == "96965261" {
				commons.Log("User " + userId + " loop check")
			}

			val, ok := Events[userId]
			if ok && val.data != "" {
				if userId == "96965261" {
					commons.Log("We already have loaded event")
				}
				continue
			}

			row := database.DB.QueryRow(`SELECT "timestamp", "data" FROM "eventsub_events" WHERE "userid"=$1 ORDER BY "timestamp" ASC LIMIT 1`, userId)
			if userId == "96965261" {
				commons.Log("User " + userId + " starting SELECT")
			}
			var timestamp time.Time
			var data string
			err := row.Scan(&timestamp, &data)
			if userId == "96965261" {
				commons.Log("User " + userId + " SELECT scan")
			}

			if err == nil {
				Events[userId] = struct {
					timestamp time.Time
					data      string
				}{
					timestamp: timestamp,
					data:      data,
				}
			}
		}
		mutex.Unlock()

		time.Sleep(time.Second * 2 /* / 3 */)
	}
}

func Listen(userId string) {
	mutex.Lock()
	Events[userId] = struct {
		timestamp time.Time
		data      string
	}{
		timestamp: time.Now(),
		data:      "",
	}
	mutex.Unlock()
}

func Done(userId string) {
	mutex.Lock()
	delete(Events, userId)
	mutex.Unlock()
}

func Get(userId string) (struct {
	timestamp time.Time
	data      string
}, bool) {
	mutex.RLock()
	val, ok := Events[userId]
	mutex.RUnlock()
	return val, ok
}
