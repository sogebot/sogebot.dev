package authenticators

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
)

func Google(w http.ResponseWriter, r *http.Request) {
	var GOOGLE_CLIENTID, GOOGLE_CLIENTSECRET, REDIRECTURI string
	GOOGLE_CLIENTID = os.Getenv("GOOGLE_CLIENTID")
	GOOGLE_CLIENTSECRET = os.Getenv("GOOGLE_CLIENTSECRET")
	REDIRECTURI = os.Getenv("REDIRECTURI")

	if GOOGLE_CLIENTID == "" || GOOGLE_CLIENTSECRET == "" || REDIRECTURI == "" {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "Google service was not properly configured.")
		log.Println("Missing Google ClientID, ClientSecret or RedirectUri")
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

		scopes := []string{
			"https://www.googleapis.com/auth/youtube",
		}

		q := url.Values{}
		q.Add("client_id", GOOGLE_CLIENTID)
		q.Add("redirect_uri", REDIRECTURI+"/credentials/google")
		q.Add("response_type", "code")
		q.Add("scope", strings.Join(scopes, " "))
		q.Add("include_granted_scopes", "true")
		q.Add("access_type", "offline")
		q.Add("state", state)
		q.Add("prompt", "consent")

		http.Redirect(w, r, "https://accounts.google.com/o/oauth2/v2/auth?"+q.Encode(), http.StatusSeeOther)
	} else {
		params := url.Values{}
		params.Add("client_id", GOOGLE_CLIENTID)
		params.Add("client_secret", GOOGLE_CLIENTSECRET)
		params.Add("redirect_uri", REDIRECTURI+"/credentials/google")
		params.Add("grant_type", "authorization_code")
		params.Add("code", code)

		client := &http.Client{}
		req, _ := http.NewRequest(http.MethodPost, "https://oauth2.googleapis.com/token", strings.NewReader(params.Encode())) // URL-encoded payload
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

func GoogleRefresh(w http.ResponseWriter, r *http.Request) {
	var GOOGLE_CLIENTID, GOOGLE_CLIENTSECRET, REDIRECTURI string
	GOOGLE_CLIENTID = os.Getenv("GOOGLE_CLIENTID")
	GOOGLE_CLIENTSECRET = os.Getenv("GOOGLE_CLIENTSECRET")
	REDIRECTURI = os.Getenv("REDIRECTURI")

	if GOOGLE_CLIENTID == "" || GOOGLE_CLIENTSECRET == "" || REDIRECTURI == "" {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "Google service was not properly configured.")
		log.Println("Missing Google ClientID, ClientSecret or RedirectUri")
		return
	}

	query, _ := ioutil.ReadAll(r.Body)
	refreshToken, _ := url.PathUnescape(strings.Split(strings.Split(string(query), "&")[0], "=")[1])
	params := url.Values{}
	params.Add("client_id", GOOGLE_CLIENTID)
	params.Add("client_secret", GOOGLE_CLIENTSECRET)
	params.Add("refresh_token", refreshToken)
	params.Add("grant_type", "refresh_token")

	client := &http.Client{}
	req, _ := http.NewRequest(http.MethodPost, "https://oauth2.googleapis.com/token", strings.NewReader(params.Encode())) // URL-encoded payload
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
