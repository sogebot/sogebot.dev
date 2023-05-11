package handler

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"golang.ngrok.com/ngrok"
	"golang.ngrok.com/ngrok/config"
)

var EVENTSUB_URL = "https://eventsub.sogebot.xyz"

func ngrokTunnel(done chan<- bool) error {
	tun, err := ngrok.Listen(context.Background(),
		config.HTTPEndpoint(),
		ngrok.WithAuthtokenFromEnv(),
	)
	if err != nil {
		return err
	}

	EVENTSUB_URL = tun.URL()

	done <- true
	return http.Serve(tun, http.HandlerFunc(handler))
}

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "<h1>Hello from ngrok-go.</h1>")
}

func Start() {
	var ENV string = os.Getenv("ENV")
	if ENV == "development" {
		fmt.Println("== development version, using ngrok tunnel ==")
		done := make(chan bool)

		go func() {
			if err := ngrokTunnel(done); err != nil {
				log.Fatal(err)
			}
		}()
		<-done
	} else {
		log.Fatal("No production handler!")
	}

	fmt.Println("Webhooks endpoint:", EVENTSUB_URL)

}
