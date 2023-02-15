package routes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-playground/validator/v10"
)

type Overlay struct {
	*OverlayStripped
	Data  string `json:"data" validate:"required"`
	Items string `json:"items" validate:"required"`
}

type error struct {
	Path  string `json:"path"`
	Error string `json:"error"`
	Param string `json:"param"`
}

func PostOverlay(w http.ResponseWriter, r *http.Request, db *sql.DB, validate *validator.Validate) {
	headerContentType := r.Header.Get("Content-Type")
	if headerContentType != "application/json" {
		w.WriteHeader(http.StatusUnsupportedMediaType)
		return
	}

	var overlay Overlay

	// Try to decode the request body into the struct. If there is an error,
	// respond to the client with the error message and a 400 status code.
	err := json.NewDecoder(r.Body).Decode(&overlay)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	t := time.Now()
	overlay.PublishedAt = t.Format("2006-01-02T15:04:05.999Z")
	overlay.PublisherId = r.Header.Get("userId")

	err = validate.Struct(overlay)
	if err != nil {
		var errors []error
		for _, err := range err.(validator.ValidationErrors) {
			errors = append(errors, error{
				Path:  err.Field(),
				Error: err.Tag(),
				Param: err.Param(),
			})
		}

		if f, err := json.Marshal(errors); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Print(err)
			fmt.Fprint(w, "500 - Internal server error")
		} else {
			w.Header().Add("content-type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, string(f))
		}
		return
	}

	err = db.QueryRow(`
			INSERT INTO "overlay" ("name", "description", "publisherId", "publishedAt", "data", "items", "version", "compatibleWith", "importedCount")
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
			RETURNING "id"`,
		overlay.Name, overlay.Description, overlay.PublisherId, overlay.PublishedAt, overlay.Data, overlay.Items, 1, overlay.CompatibleWith,
	).Scan(&overlay.Id)

	if err != nil || err == sql.ErrNoRows {
		fmt.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "500 - Internal server error")
		return
	}

	if f, err := json.Marshal(overlay); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Print(err)
		fmt.Fprint(w, "500 - Internal server error")
	} else {
		w.Header().Add("content-type", "application/json")
		w.WriteHeader(200)
		fmt.Fprint(w, string(f))
	}
}
