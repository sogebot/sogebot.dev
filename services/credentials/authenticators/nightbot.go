package authenticators

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
)

func Nightbot(w http.ResponseWriter, r *http.Request) {
	var NIGHTBOT_CLIENTID, NIGHTBOT_CLIENTSECRET, REDIRECTURI string
	NIGHTBOT_CLIENTID = os.Getenv("NIGHTBOT_CLIENTID")
	NIGHTBOT_CLIENTSECRET = os.Getenv("NIGHTBOT_CLIENTSECRET")
	REDIRECTURI = os.Getenv("REDIRECTURI")

	if NIGHTBOT_CLIENTID == "" || NIGHTBOT_CLIENTSECRET == "" || REDIRECTURI == "" {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "Nightbot service was not properly configured.")
		log.Println("Missing Nightbot ClientID=" + NIGHTBOT_CLIENTID + ", ClientSecret=" + NIGHTBOT_CLIENTSECRET + " or RedirectUri=" + REDIRECTURI)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		scopes := []string{
			"song_requests_playlist",
			"commands",
			"timers",
		}
		q := url.Values{}
		q.Add("client_id", NIGHTBOT_CLIENTID)
		q.Add("redirect_uri", REDIRECTURI+"/credentials/nightbot")
		q.Add("response_type", "code")
		q.Add("scope", strings.Join(scopes, " "))
		q.Add("force_verify", "true")

		http.Redirect(w, r, "https://api.nightbot.tv/oauth2/authorize?"+q.Encode(), http.StatusSeeOther)
	} else {
		params := url.Values{}
		params.Add("client_id", NIGHTBOT_CLIENTID)
		params.Add("client_secret", NIGHTBOT_CLIENTSECRET)
		params.Add("redirect_uri", REDIRECTURI+"/credentials/nightbot")
		params.Add("grant_type", "authorization_code")
		params.Add("code", code)

		client := &http.Client{}
		req, _ := http.NewRequest(http.MethodPost, "https://api.nightbot.tv/oauth2/token", strings.NewReader(params.Encode())) // URL-encoded payload
		req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

		resp, _ := client.Do(req)
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			log.Fatalln(err)
		}
		defer resp.Body.Close()

		w.WriteHeader(resp.StatusCode)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, string(body))
	}
}
