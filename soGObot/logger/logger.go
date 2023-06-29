package logger

import (
	"fmt"
	"time"
)

func Info(message string) {
	t := time.Now()
	fmt.Printf("%s %s\n",
		t.Format(time.RFC3339),
		message,
	)
}
