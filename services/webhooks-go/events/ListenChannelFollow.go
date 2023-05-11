package events

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"services/webhooks/commons"
	"services/webhooks/handler"
	"services/webhooks/token"
	"sync"
)

type Subscription struct {
	ID        string                   `json:"id"`
	Status    string                   `json:"status"`
	Type      string                   `json:"type"`
	Version   string                   `json:"version"`
	Cost      int                      `json:"cost"`
	Condition FollowCondition          `json:"condition"`
	Transport SubscriptionAddTransport `json:"transport"`
	CreatedAt string                   `json:"created_at"`
}

type SubscriptionAddTransport struct {
	Method   Method `json:"method"`
	Callback string `json:"callback"`
	Secret   string `json:"secret"`
}

type FollowCondition struct {
	BroadcasterUserID string `json:"broadcaster_user_id"`
	ModeratorUserID   string `json:"moderator_user_id"`
}

func ListenChannelFollow(wg *sync.WaitGroup, userId string, scopes string) {
	defer wg.Done()

	var clientID string = os.Getenv("TWITCH_EVENTSUB_CLIENTID")
	var secret string = os.Getenv("TWITCH_EVENTSUB_SECRET")

	// Define the request body as a struct
	requestBody := struct {
		Type      string                   `json:"type"`
		Version   string                   `json:"version"`
		Condition Condition                `json:"condition"`
		Transport SubscriptionAddTransport `json:"transport"`
	}{
		Type:    "channel.follow",
		Version: "2",
		Condition: Condition{
			BroadcasterUserID: &userId,
			ModeratorUserID:   &userId,
		},
		Transport: SubscriptionAddTransport{
			Method:   "webhook",
			Callback: handler.EVENTSUB_URL + "/callback",
			Secret:   secret,
		},
	}

	// Convert the request body struct to JSON
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		fmt.Println("Error marshaling request body:", err)
		return
	}

	// Create an HTTP client
	client := &http.Client{}

	// Create a POST request
	req, err := http.NewRequest("POST", "https://api.twitch.tv/helix/eventsub/subscriptions", bytes.NewBuffer(jsonBody))
	if err != nil {
		fmt.Println("Error creating request:", err)
		return
	}

	token, err := token.Access()
	if err != nil {
		fmt.Println("Error getting token:", err)
		return
	}

	// Set request headers
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Client-Id", clientID)
	req.Header.Set("Content-Type", "application/json")

	// Send the request
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

	// Check the response status code
	if resp.StatusCode == http.StatusConflict {
		// ignore this, we have pending or already registered webhook
		return
	} else if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		commons.Log("User " + userId + " error for channel.follow: " + string(body))
		return
	}
}
