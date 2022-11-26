package authenticators

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
)

func DonationAlerts(w http.ResponseWriter, r *http.Request) {
	var DONATIONALERTS_CLIENTID, DONATIONALERTS_CLIENTSECRET, REDIRECTURI string
	DONATIONALERTS_CLIENTID = os.Getenv("DONATIONALERTS_CLIENTID")
	DONATIONALERTS_CLIENTSECRET = os.Getenv("DONATIONALERTS_CLIENTSECRET")
	REDIRECTURI = os.Getenv("REDIRECTURI")

	if DONATIONALERTS_CLIENTID == "" || DONATIONALERTS_CLIENTSECRET == "" || REDIRECTURI == "" {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "DonationAlerts service was not properly configured.")
		log.Println("Missing DonationAlerts ClientID=" + DONATIONALERTS_CLIENTID + ", ClientSecret=" + DONATIONALERTS_CLIENTSECRET + " or RedirectUri=" + REDIRECTURI)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		scopes := []string{
			"oauth-user-show",
			"oauth-donation-subscribe",
			"oauth-donation-index",
		}
		q := url.Values{}
		q.Add("client_id", DONATIONALERTS_CLIENTID)
		q.Add("redirect_uri", REDIRECTURI+"/credentials/donationalerts")
		q.Add("response_type", "code")
		q.Add("scope", strings.Join(scopes, " "))
		q.Add("force_verify", "true")

		http.Redirect(w, r, "https://www.donationalerts.com/oauth/authorize?"+q.Encode(), http.StatusSeeOther)
	} else {
		params := url.Values{}
		params.Add("client_id", DONATIONALERTS_CLIENTID)
		params.Add("client_secret", DONATIONALERTS_CLIENTSECRET)
		params.Add("redirect_uri", REDIRECTURI+"/credentials/donationalerts")
		params.Add("grant_type", "authorization_code")
		params.Add("code", code)

		client := &http.Client{}
		req, _ := http.NewRequest(http.MethodPost, "https://www.donationalerts.com/oauth/token", strings.NewReader(params.Encode())) // URL-encoded payload
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

type refreshRequestBody struct {
	RefreshToken string `json:"refreshToken"`
}

func DonationAlertsRefresh(w http.ResponseWriter, r *http.Request) {
	var DONATIONALERTS_CLIENTID, DONATIONALERTS_CLIENTSECRET, REDIRECTURI string
	DONATIONALERTS_CLIENTID = os.Getenv("DONATIONALERTS_CLIENTID")
	DONATIONALERTS_CLIENTSECRET = os.Getenv("DONATIONALERTS_CLIENTSECRET")
	REDIRECTURI = os.Getenv("REDIRECTURI")

	if DONATIONALERTS_CLIENTID == "" || DONATIONALERTS_CLIENTSECRET == "" || REDIRECTURI == "" {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "Twitch service was not properly configured.")
		log.Println("Missing Twitch ClientID, ClientSecret or RedirectUri")
		return
	}

	query, _ := ioutil.ReadAll(r.Body)
	requestBody := refreshRequestBody{}
	json.Unmarshal([]byte(query), &requestBody)

	scopes := []string{
		"oauth-user-show",
		"oauth-donation-subscribe",
		"oauth-donation-index",
	}

	params := url.Values{}
	params.Add("client_id", DONATIONALERTS_CLIENTID)
	params.Add("client_secret", DONATIONALERTS_CLIENTSECRET)
	params.Add("refresh_token", requestBody.RefreshToken)
	params.Add("scope", strings.Join(scopes, " "))
	params.Add("grant_type", "refresh_token")

	client := &http.Client{}
	req, _ := http.NewRequest(http.MethodPost, "https://www.donationalerts.com/oauth/token?"+params.Encode(), nil) // URL-encoded payload
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
