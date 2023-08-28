package routes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-playground/validator/v10"
)

type Plugin struct {
	*PluginStripped
	Plugin string `json:"plugin" validate:"required"`
}

func PostPlugin(w http.ResponseWriter, r *http.Request, db *sql.DB, validate *validator.Validate) {
	headerContentType := r.Header.Get("Content-Type")
	if headerContentType != "application/json" {
		w.WriteHeader(http.StatusUnsupportedMediaType)
		return
	}

	var plugin Plugin

	// Try to decode the request body into the struct. If there is an error,
	// respond to the client with the error message and a 400 status code.
	err := json.NewDecoder(r.Body).Decode(&plugin)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	t := time.Now()
	plugin.PublishedAt = t.Format("2006-01-02T15:04:05.999Z")
	plugin.PublisherId = r.Header.Get("userId")

	err = validate.Struct(plugin)
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
		INSERT INTO "plugin" ("name", "description", "publisherId", "publishedAt", "plugin", "version", "compatibleWith")
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING "id"`,
		plugin.Name, plugin.Description, plugin.PublisherId, plugin.PublishedAt, plugin.Plugin, 1, plugin.CompatibleWith,
	).Scan(&plugin.Id)

	if err != nil || err == sql.ErrNoRows {
		fmt.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "500 - Internal server error")
		return
	}

	if f, err := json.Marshal(plugin); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Print(err)
		fmt.Fprint(w, "500 - Internal server error")
	} else {
		w.Header().Add("content-type", "application/json")
		w.WriteHeader(200)
		fmt.Fprint(w, string(f))
	}
}
