package handler

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"services/webhooks/commons"
	"services/webhooks/database"
	"services/webhooks/debug"
	"strings"
	"time"

	"net/http/pprof"
	_ "net/http/pprof"

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
	BroadcasterUserID     string `json:"broadcaster_user_id"`
	ToBroadcasterUserID   string `json:"to_broadcaster_user_id"`
	FromBroadcasterUserID string `json:"from_broadcaster_user_id"`
	ModeratorUserID       string `json:"moderator_user_id"`
	UserId                string `json:"user_id"`
}

type Transport struct {
	Method   string `json:"method"`
	Callback string `json:"callback"`
}

var c = cors.New(cors.Options{
	AllowedOrigins:   []string{"*"},
	AllowCredentials: true,
	AllowedHeaders:   []string{"Authorization", "content-type"},
})

func ngrokTunnel(done chan<- bool) error {
	tun, err := ngrok.Listen(context.Background(),
		config.HTTPEndpoint(),
		ngrok.WithAuthtokenFromEnv(),
	)
	if err != nil {
		return err
	}

	EVENTSUB_URL = tun.URL()
	corshandler := c.Handler(http.HandlerFunc(handler))
	loggerHandler := commons.Logger(corshandler)

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
	code := r.Header.Get("Authorization")

	if len(code) == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		w.Header().Add("Content-Type", "text/plain")
		fmt.Fprint(w, "Missing authorization header")
		return
	}

	url := "https://id.twitch.tv/oauth2/validate"
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Println("Error creating request:", err)
		return
	}
	req.Header.Set("Authorization", code)
	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request:", err)
		return
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response:", err)
		return
	}

	// Unmarshal the response body into a Response struct
	var response struct {
		ClientID  string   `json:"client_id"`
		Login     string   `json:"login"`
		Scopes    []string `json:"scopes"`
		UserID    string   `json:"user_id"`
		ExpiresIn int64    `json:"expires_in"`
	}

	err = json.Unmarshal(body, &response)
	if err != nil {
		fmt.Println("Error unmarshaling response:", err)
		return
	}

	scopes := strings.Join(response.Scopes, " ")
	userId := response.UserID

	var db_scopes string
	user_exists := true
	row := database.DB.QueryRow("SELECT scopes FROM eventsub_users WHERE \"userId\"=$1", userId)
	err = row.Scan(&db_scopes)
	if err != nil {
		user_exists = false
		if err != sql.ErrNoRows {
			w.WriteHeader(http.StatusInternalServerError)
			w.Header().Add("Content-Type", "text/plain")
			fmt.Fprint(w, err)
			commons.Log(err.Error())
			return
		}
	}

	if !user_exists {
		commons.Debug("User " + userId + " not found. Creating.")
		database.DB.Exec("INSERT INTO eventsub_users (\"userId\", scopes) VALUES ($1, $2)",
			userId, scopes,
		)
		returnSuccess(w)
		return
	}

	if db_scopes == scopes {
		commons.Debug("User " + userId + " have no new scopes. Skipping")
	} else {
		commons.Debug("User " + userId + " have new scopes " + scopes + ". Updating")
		database.DB.Exec("UPDATE eventsub_users SET scopes=$1, updated=$2 WHERE \"userId\"=$3",
			scopes, true, userId,
		)
	}
	returnSuccess(w)
}

func returnSuccess(w http.ResponseWriter) {
	w.WriteHeader(http.StatusOK)
	w.Header().Add("Content-Type", "text/plain")
	fmt.Fprint(w, "Success")
}

func getUser(w http.ResponseWriter, r *http.Request) {
	userId := r.Header.Get("sogebot-event-userid")

	if debug.IsDEV() {
		userId = "96965261"
	}

	t := time.Now()
	log.Printf("[%s - %s] #%s \"%s %s %s\" %s %s \n",
		r.RemoteAddr,
		t.Format("02/Jan/2006:15:04:05 -0700"),
		userId,
		r.Method,
		r.URL.Path,
		r.Proto,
		"???",
		r.UserAgent(),
	)

	// Set the response headers
	w.Header().Set("Content-Type", "text/plain")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	if len(userId) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	timeout := time.Now().Add((time.Minute * 2) - 15*time.Second)

	go Listen(userId)
	defer Done(userId)

	for {
		if timeout.Before((time.Now())) {
			// Set the response status code and write the initial response
			w.WriteHeader(http.StatusNoContent)
			return
		}

		select {
		case <-r.Context().Done():
			w.WriteHeader(http.StatusGone)
			return
		default:
			val, ok := Get(userId)
			if ok && val.data != "" {
				// Send the response
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(val.data))

				// Delete the used data from the database
				deleteQuery := `DELETE FROM "eventsub_events" WHERE "userid"=$1 AND "timestamp"=$2`
				database.DB.Exec(deleteQuery, userId, val.timestamp)
				return
			} else {
				// No event found for the user
				time.Sleep(time.Second)
			}
		}
	}
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

				broadcasterId := notification.Subscription.Condition.BroadcasterUserID
				if notification.Subscription.Condition.ToBroadcasterUserID != "" {
					broadcasterId = notification.Subscription.Condition.ToBroadcasterUserID
				}
				if notification.Subscription.Condition.FromBroadcasterUserID != "" {
					broadcasterId = notification.Subscription.Condition.FromBroadcasterUserID
				}
				if notification.Subscription.Condition.UserId != "" {
					broadcasterId = notification.Subscription.Condition.UserId
				}
				commons.Log("User " + broadcasterId + " subscribed to " + notification.Subscription.Type + ".v" + notification.Subscription.Version)
				return
			}
		}

		if messageType == "revocation" {
			if contentType == "application/json" {

				type Payload struct {
					Subscription struct {
						Type      string `json:"type"`
						Condition struct {
							BroadcasterUserID     *string `json:"broadcaster_user_id,omitempty"`
							ToBroadcasterUserID   *string `json:"to_broadcaster_user_id,omitempty"`
							FromBroadcasterUserID *string `json:"from_broadcaster_user_id,omitempty"`
							ModeratorUserID       string `json:"moderator_user_id,omitempty"`
							UserId                *string `json:"user_id,omitempty"`
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
				if payload.Subscription.Condition.ToBroadcasterUserID != nil {
					userId = payload.Subscription.Condition.ToBroadcasterUserID
				}
				if payload.Subscription.Condition.FromBroadcasterUserID != nil {
					userId = payload.Subscription.Condition.FromBroadcasterUserID
				}
				if payload.Subscription.Condition.UserId != nil {
					userId = payload.Subscription.Condition.UserId
				}
				database.DB.Exec("DELETE FROM eventsub_users WHERE \"userId\"=$1", userId)
				w.WriteHeader(204)

				return
			}
		}

		if messageType == "notification" {
			if contentType == "application/json" {
				type Payload struct {
					Subscription struct {
						Type      string `json:"type"`
						Condition struct {
							BroadcasterUserID     *string `json:"broadcaster_user_id,omitempty"`
							ToBroadcasterUserID   *string `json:"to_broadcaster_user_id,omitempty"`
							FromBroadcasterUserID *string `json:"from_broadcaster_user_id,omitempty"`
							ModeratorUserID       string `json:"moderator_user_id,omitempty"`
							UserId                *string `json:"user_id,omitempty"`
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
				if payload.Subscription.Condition.ToBroadcasterUserID != nil {
					userId = payload.Subscription.Condition.ToBroadcasterUserID
				}
				if payload.Subscription.Condition.FromBroadcasterUserID != nil {
					userId = payload.Subscription.Condition.FromBroadcasterUserID
				}
				if payload.Subscription.Condition.UserId != nil {
					userId = payload.Subscription.Condition.UserId
				}
				event := payload.Subscription.Type
				jsonData := string(body)

				commons.Log("User " + *userId + " received new event " + event)
				rows, err := database.DB.Query("INSERT INTO eventsub_events (userId, event, data) VALUES ($1, $2, $3)", userId, event, jsonData)
				if err != nil {
					http.Error(w, "Failed to insert into eventsub_events", http.StatusBadRequest)
					return
				}
				defer rows.Close()
				w.WriteHeader(204)
				return
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
			go startPprof()
			if err := ngrokTunnel(done); err != nil {
				log.Fatal(err)
			}
		}()
		<-done
	} else {
		corshandler := c.Handler(http.HandlerFunc(handler))
		loggerHandler := commons.Logger(corshandler)
		// limitHandler := httprate.Limit(
		// 	60,          // requests
		// 	time.Minute, // per duration
		// 	httprate.WithKeyFuncs(httprate.KeyByIP, httprate.KeyByEndpoint),
		// )(loggerHandler)

		go func() {
			go startPprof()
			if err := http.ListenAndServe(":8080", loggerHandler); err != nil {
				log.Fatal(err)
			}
		}()
	}

	commons.Log("Webhooks endpoint: " + EVENTSUB_URL)
}

func startPprof() {
	router := mux.NewRouter()
	router.Handle("/debug/pprof/", http.HandlerFunc(pprof.Index))
	router.Handle("/debug/pprof/cmdline", http.HandlerFunc(pprof.Cmdline))
	router.Handle("/debug/pprof/profile", http.HandlerFunc(pprof.Profile))
	router.Handle("/debug/pprof/symbol", http.HandlerFunc(pprof.Symbol))
	router.Handle("/debug/pprof/trace", http.HandlerFunc(pprof.Trace))
	router.Handle("/debug/pprof/{cmd}", http.HandlerFunc(pprof.Index)) // special handling for Gorilla mux

	if err := http.ListenAndServe(":8081", router); err != nil {
		log.Fatal(err)
	}
}
