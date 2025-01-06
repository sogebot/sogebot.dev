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

func Streamlabs(w http.ResponseWriter, r *http.Request) {
	var STREAMLABS_CLIENTID, STREAMLABS_CLIENTSECRET, REDIRECTURI string
	STREAMLABS_CLIENTID = os.Getenv("STREAMLABS_CLIENTID")
	STREAMLABS_CLIENTSECRET = os.Getenv("STREAMLABS_CLIENTSECRET")
	REDIRECTURI = os.Getenv("REDIRECTURI")

	if STREAMLABS_CLIENTID == "" || STREAMLABS_CLIENTSECRET == "" || REDIRECTURI == "" {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "DonationAlerts service was not properly configured.")
		log.Println("Missing DonationAlerts ClientID=" + STREAMLABS_CLIENTID + ", ClientSecret=" + STREAMLABS_CLIENTSECRET + " or RedirectUri=" + REDIRECTURI)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		scopes := []string{
			"donations.read",
			"socket.token",
		}
		q := url.Values{}
		q.Add("client_id", STREAMLABS_CLIENTID)
		q.Add("redirect_uri", REDIRECTURI+"/credentials/streamlabs")
		q.Add("response_type", "code")
		q.Add("scope", strings.Join(scopes, " "))
		q.Add("force_verify", "true")
		http.Redirect(w, r, "https://www.streamlabs.com/api/v1.0/authorize?"+q.Encode(), http.StatusSeeOther)
	} else {
		params := url.Values{}
		params.Add("client_id", STREAMLABS_CLIENTID)
		params.Add("client_secret", STREAMLABS_CLIENTSECRET)
		params.Add("redirect_uri", REDIRECTURI+"/credentials/streamlabs")
		params.Add("grant_type", "authorization_code")
		params.Add("code", code)

		client := &http.Client{}
		req, _ := http.NewRequest(http.MethodPost, "https://streamlabs.com/api/v1.0/token", strings.NewReader(params.Encode())) // URL-encoded payload
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
