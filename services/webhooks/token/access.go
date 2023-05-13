package token

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"services/webhooks/commons"
	"strings"
	"time"
)

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
}

var accessTokenCache string
var expirationTime time.Time

func Access() (string, error) {
	if len(accessTokenCache) > 0 && expirationTime.After((time.Now())) {
		commons.Debug("Reusing old access token")
		return accessTokenCache, nil
	}
	commons.Debug("Generating new access token")

	// Set your Twitch app's client ID and secret
	var clientID string = os.Getenv("TWITCH_EVENTSUB_CLIENTID")
	var clientSecret string = os.Getenv("TWITCH_EVENTSUB_CLIENTSECRET")

	// Create an HTTP client
	client := &http.Client{}

	// Create a POST request to the token endpoint
	data := url.Values{}
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("grant_type", "client_credentials")
	data.Set("scope", "") // Set the desired scope if needed
	req, err := http.NewRequest("POST", "https://id.twitch.tv/oauth2/token", strings.NewReader(data.Encode()))
	if err != nil {
		fmt.Println("Error creating request:", err)
		return "", errors.New(err.Error())
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	// Send the request
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request:", err)
		return "", errors.New(err.Error())
	}
	defer resp.Body.Close()

	// Parse the response JSON
	var tokenResponse TokenResponse
	err = json.NewDecoder(resp.Body).Decode(&tokenResponse)
	if err != nil {
		fmt.Println("Error decoding response:", err)
		return "", errors.New(err.Error())
	}

	// Print the access token
	accessTokenCache = tokenResponse.AccessToken
	expirationTime = time.Now().Add(time.Duration(tokenResponse.ExpiresIn-60) * time.Second)

	return accessTokenCache, nil
}
