package auth

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"
)

type responseWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func wrapResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{ResponseWriter: w}
}

func (rw *responseWriter) Status() int {
	return rw.status
}

func (rw *responseWriter) WriteHeader(code int) {
	if rw.wroteHeader {
		return
	}
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
	rw.wroteHeader = true
}

type TwitchAuthResponse struct {
	ClientID  string   `json:"client_id"`
	Login     string   `json:"login"`
	Scopes    []string `json:"scopes"`
	UserID    string   `json:"user_id"`
	ExpiresIn int      `json:"expires_in"`
}

type TwitchAuthResponseError struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

func AuthMiddlewareWithLogger(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t := time.Now()
		user := "<unknown user>"
		interceptWriter := wrapResponseWriter(w)

		authHeader := strings.Split(r.Header.Get("Authorization"), "Bearer ")
		if len(authHeader) != 2 {
			interceptWriter.WriteHeader(http.StatusUnauthorized)
			interceptWriter.Write([]byte("401 - Unauthorized"))
		} else {
			authToken := authHeader[1]

			url := "https://id.twitch.tv/oauth2/validate"

			client := &http.Client{}
			req, err := http.NewRequest("GET", url, nil)
			if err != nil {
				log.Fatalln(err)
			}
			req.Header.Add("Authorization", "Bearer "+authToken)
			resp, err := client.Do(req)
			if err != nil {
				log.Fatalln(err)
			}
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				log.Fatalln(err)
			}

			userObj := TwitchAuthResponse{}
			errorObj := TwitchAuthResponseError{}
			json.Unmarshal(body, &userObj)
			json.Unmarshal(body, &errorObj)

			if errorObj.Message == "" {
				user = userObj.Login + "#" + userObj.UserID
				r.Header.Add("userId", userObj.UserID)
				handler.ServeHTTP(interceptWriter, r)
			} else {
				interceptWriter.WriteHeader(http.StatusUnauthorized)
				interceptWriter.Write([]byte("401 - Unauthorized"))
			}
		}

		log.Printf("[%s - %s - %s] \"%s %s %s\" %d %s %dus\n",
			r.RemoteAddr,
			user,
			t.Format("02/Jan/2006:15:04:05 -0700"),
			r.Method,
			r.URL.Path,
			r.Proto,
			interceptWriter.status,
			r.UserAgent(),
			time.Since(t),
		)
	})
}
