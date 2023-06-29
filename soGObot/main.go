package main

import (
	"fmt"
	"sogebot/backend/logger"

	"github.com/common-nighthawk/go-figure"
)

// Hello returns a greeting for the named person.
func main() {
	myFigure := figure.NewFigure("sogeBot", "doom", true)
	myFigure.Print()
	fmt.Println("Version: 19.2.0-c3502526")

	logger.Info("Bot is starting up...")
}
