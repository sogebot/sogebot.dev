package debug

import "os"

func IsDEV() bool {
	return os.Getenv("ENV") == "development"
}
