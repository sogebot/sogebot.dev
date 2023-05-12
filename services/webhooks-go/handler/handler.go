package handler

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"services/webhooks/commons"
	"services/webhooks/database"
	"strings"
	"time"

	"github.com/go-chi/httprate"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"golang.ngrok.com/ngrok"
	"golang.ngrok.com/ngrok/config"
)

var EVENTSUB_URL = "https://eventsub.sogebot.xyz"
var EVENTSUB_URL_PROD = EVENTSUB_URL

type WebhookCallbackVerification struct {
	Challenge    string       `json:"challenge"`
	Subscription Subscription `json:"subscription"`
}

type Subscription struct {
	ID        string    `json:"id"`
	Status    string    `json:"status"`
	Type      string    `json:"type"`
	Version   string    `json:"version"`
	Cost      int64     `json:"cost"`
	Condition Condition `json:"condition"`
	Transport Transport `json:"transport"`
	CreatedAt string    `json:"created_at"`
}

type Condition struct {
	BroadcasterUserID string `json:"broadcaster_user_id"`
}

type Transport struct {
	Method   string `json:"method"`
	Callback string `json:"callback"`
}

func ngrokTunnel(done chan<- bool) error {
	tun, err := ngrok.Listen(context.Background(),
		config.HTTPEndpoint(),
		ngrok.WithAuthtokenFromEnv(),
	)
	if err != nil {
		return err
	}

	EVENTSUB_URL = tun.URL()
	loggerHandler := commons.Logger(http.HandlerFunc(handler))

	done <- true
	return http.Serve(tun, loggerHandler)
}

func secureCompare(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}

	result := 0
	for i := 0; i < len(a); i++ {
		result |= int(a[i]) ^ int(b[i])
	}
	return result == 0
}

func verifySignature(w http.ResponseWriter, r *http.Request, body []byte) bool {
	timestamp := r.Header.Get("Twitch-Eventsub-Message-Timestamp")
	messageID := r.Header.Get("Twitch-Eventsub-Message-Id")
	signature := r.Header.Get("Twitch-Eventsub-Message-Signature")
	secret := os.Getenv("TWITCH_EVENTSUB_SECRET")

	// Recreate the message by concatenating the required values
	message := messageID + timestamp + string(body)

	// Create the HMAC signature using the secret and the message
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(message))
	expectedSignature := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	// Compare the expected signature with the received signature securely
	if !secureCompare([]byte(signature), []byte(expectedSignature)) {
		commons.Debug("Signature verification FAILED!")
		http.Error(w, "Signature verification failed", http.StatusBadRequest)
		return false
	}

	commons.Debug("Signature verified!")
	return true
}

func postUser(w http.ResponseWriter, r *http.Request) {
	return
}

func getUser(w http.ResponseWriter, r *http.Request) {
	userId := r.Header.Get("sogebot-event-userid")

	// Set the response headers
	w.Header().Set("Content-Type", "text/plain")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	if len(userId) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	for i := 0; i < 110*3; i++ {
		select {
		case <-r.Context().Done():
			w.WriteHeader(http.StatusGone)
			return
		default:
			row := database.DB.QueryRow(`SELECT "timestamp", "data" FROM "eventsub_events" WHERE "userid"=$1 ORDER BY "timestamp" ASC LIMIT 1`, userId)

			var timestamp time.Time
			var data string
			err := row.Scan(&timestamp, &data)
			if err == nil {
				// Send the response
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(data))

				// Delete the used data from the database
				deleteQuery := `DELETE FROM "eventsub_events" WHERE "userid"=$1 AND "timestamp"=$2`
				database.DB.Exec(deleteQuery, userId, timestamp)
				return
			} else {
				// No event found for the user
				time.Sleep(time.Second / 3)
			}
		}
	}

	// Set the response status code and write the initial response
	w.WriteHeader(http.StatusNoContent)
}

func handler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet && r.URL.Path == "/user" {
		getUser(w, r)
		return
	}
	if r.Method == http.MethodPost && r.URL.Path == "/user" {
		postUser(w, r)
		return
	}
	if r.URL.Path == "/callback" {
		commons.Debug("====== EVENT RECEIVED =======")
		// List the available headers
		for header, values := range r.Header {
			commons.Debug(header + ":" + strings.Join(values, ""))
		}

		messageType := strings.ToLower(r.Header.Get("Twitch-Eventsub-Message-Type"))
		contentType := r.Header.Get("Content-Type")

		// Read body
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if contentType == "application/json" {
			//  verify if signature is OK
			if !verifySignature(w, r, body) {
				return
			}
		}

		if messageType == "webhook_callback_verification" {
			if contentType == "application/json" {
				var notification WebhookCallbackVerification
				err = json.NewDecoder(strings.NewReader(string(body))).Decode(&notification)
				if err != nil {
					http.Error(w, err.Error(), http.StatusBadRequest)
					return
				}
				w.WriteHeader(http.StatusOK)
				fmt.Fprintf(w, notification.Challenge)

				commons.Log("User " + notification.Subscription.Condition.BroadcasterUserID + " subscribed to " + notification.Subscription.Type + ".v" + notification.Subscription.Version)
				return
			}
		}

		if messageType == "revocation" {
			w.WriteHeader(204)
			return
		}

		if messageType == "notification" {
			if contentType == "application/json" {
				type Payload struct {
					Subscription struct {
						Type      string `json:"type"`
						Condition struct {
							BroadcasterUserID string `json:"broadcaster_user_id"`
						} `json:"condition"`
					} `json:"subscription"`
				}
				var payload Payload
				err = json.Unmarshal(body, &payload)
				if err != nil {
					http.Error(w, "Failed to parse JSON payload", http.StatusBadRequest)
					return
				}
				userId := payload.Subscription.Condition.BroadcasterUserID
				event := payload.Subscription.Type
				jsonData := string(body)

				commons.Log("User " + userId + " received new event " + event)
				database.DB.Query("INSERT INTO eventsub_events (userId, event, data) VALUES ($1, $2, $3)", userId, event, jsonData)
				w.WriteHeader(204)
			}
		}
	}
	w.WriteHeader(404)
}

func Start() {
	var ENV string = os.Getenv("ENV")
	if ENV == "development" {
		commons.Log("== development version, using ngrok tunnel ==")
		done := make(chan bool)

		go func() {
			if err := ngrokTunnel(done); err != nil {
				log.Fatal(err)
			}
		}()
		<-done
	} else {
		router := mux.NewRouter().StrictSlash(true)
		router.Use(commons.Logger)
		router.Use(httprate.Limit(
			10,          // requests
			time.Minute, // per duration
			httprate.WithKeyFuncs(httprate.KeyByIP, httprate.KeyByEndpoint),
		))

		c := cors.New(cors.Options{
			AllowedOrigins:   []string{"*"},
			AllowCredentials: true,
			AllowedHeaders:   []string{"Authorization", "content-type"},
		})
		handler := c.Handler(router)
		log.Fatal(http.ListenAndServe(":8080", handler))
	}

	commons.Log("Webhooks endpoint: " + EVENTSUB_URL)

}
