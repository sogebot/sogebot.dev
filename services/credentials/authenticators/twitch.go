package authenticators

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/gorilla/mux"
)

func Twitch(w http.ResponseWriter, r *http.Request) {
	var TWITCH_CLIENTID, TWITCH_CLIENTSECRET, REDIRECTURI string
	TWITCH_CLIENTID = os.Getenv("TWITCH_CLIENTID")
	TWITCH_CLIENTSECRET = os.Getenv("TWITCH_CLIENTSECRET")
	REDIRECTURI = os.Getenv("REDIRECTURI")

	if TWITCH_CLIENTID == "" || TWITCH_CLIENTSECRET == "" || REDIRECTURI == "" {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "Twitch service was not properly configured.")
		log.Println("Missing Twitch ClientID=" + TWITCH_CLIENTID + ", ClientSecret=" + TWITCH_CLIENTSECRET + " or RedirectUri=" + REDIRECTURI)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		state, err := url.QueryUnescape(r.URL.Query().Get("state"))
		if err != nil || state == "" {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, "State value couldn't be decoded or is missing.")
			return
		}

		// broadcaster scopes
		scopes := []string{
			"channel_editor",
			"chat:read",
			"chat:edit",
			"channel:moderate",
			"channel:read:subscriptions",
			"channel:manage:vips",
			"user:edit:broadcast",
			"user:read:broadcast",
			"channel:edit:commercial",
			"channel:read:redemptions",
			"moderation:read",
			"channel:read:hype_train",
			"moderator:read:chatters",
			"channel:read:polls",
			"channel:manage:polls",
			"channel:manage:predictions",
			"channel:manage:moderators",
			"moderator:manage:banned_users",
			"moderator:read:followers",
		}
		// bot scopes
		if strings.HasPrefix(state, "bot") {
			scopes = []string{
				"clips:edit",
				"user:edit:broadcast",
				"user:read:broadcast",
				"chat:read",
				"chat:edit",
				"channel:moderate",
				"whispers:read",
				"whispers:edit",
				"channel:edit:commercial",
				"moderator:manage:announcements",
				"moderator:manage:chat_messages",
				"moderator:manage:banned_users",
				"moderator:read:chatters",
				"user:manage:whispers",
			}
		}

		q := url.Values{}
		q.Add("client_id", TWITCH_CLIENTID)
		q.Add("redirect_uri", REDIRECTURI+"/credentials/twitch")
		q.Add("response_type", "code")
		q.Add("state", state)
		q.Add("scope", strings.Join(scopes, " "))
		q.Add("force_verify", "true")

		http.Redirect(w, r, "https://id.twitch.tv/oauth2/authorize?"+q.Encode(), http.StatusSeeOther)
	} else {
		params := url.Values{}
		params.Add("client_id", TWITCH_CLIENTID)
		params.Add("client_secret", TWITCH_CLIENTSECRET)
		params.Add("redirect_uri", REDIRECTURI+"/credentials/twitch")
		params.Add("grant_type", "authorization_code")
		params.Add("code", code)

		client := &http.Client{}
		req, _ := http.NewRequest(http.MethodPost, "https://id.twitch.tv/oauth2/token", strings.NewReader(params.Encode())) // URL-encoded payload
		req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

		resp, _ := client.Do(req)
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Fatalln(err)
		}
		defer resp.Body.Close()

		w.WriteHeader(resp.StatusCode)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, string(body))
	}
}

func TwitchRefresh(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	refreshToken := vars["token"]

	// to do add banned tokens through pgsql

	var TWITCH_CLIENTID, TWITCH_CLIENTSECRET, REDIRECTURI string
	TWITCH_CLIENTID = os.Getenv("TWITCH_CLIENTID")
	TWITCH_CLIENTSECRET = os.Getenv("TWITCH_CLIENTSECRET")
	REDIRECTURI = os.Getenv("REDIRECTURI")

	if TWITCH_CLIENTID == "" || TWITCH_CLIENTSECRET == "" || REDIRECTURI == "" {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "Twitch service was not properly configured.")
		log.Println("Missing Twitch ClientID, ClientSecret or RedirectUri")
		return
	}
	params := url.Values{}
	params.Add("client_id", TWITCH_CLIENTID)
	params.Add("client_secret", TWITCH_CLIENTSECRET)
	params.Add("refresh_token", refreshToken)
	params.Add("grant_type", "refresh_token")

	client := &http.Client{}
	req, _ := http.NewRequest(http.MethodPost, "https://id.twitch.tv/oauth2/token?"+params.Encode(), nil) // URL-encoded payload
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	resp, _ := client.Do(req)
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}
	defer resp.Body.Close()

	w.WriteHeader(resp.StatusCode)
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, string(body))
}
