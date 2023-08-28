package routes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gorilla/mux"
)

func PutPlugin(w http.ResponseWriter, r *http.Request, db *sql.DB, validate *validator.Validate) {
	vars := mux.Vars(r)

	headerContentType := r.Header.Get("Content-Type")
	if headerContentType != "application/json" {
		w.WriteHeader(http.StatusUnsupportedMediaType)
		return
	}

	var (
		id          string
		name        string
		version     int
		publisherId string
	)
	err := db.QueryRow(`
		SELECT "id", "name", "version", "publisherId" FROM "plugin" WHERE "id"=$1
	`, vars["id"]).Scan(&id, &name, &version, &publisherId)
	if err != nil || err == sql.ErrNoRows {
		fmt.Println(err)
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, "404 - Plugin not found")
		return
	}
	if publisherId != r.Header.Get("userId") {
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, "401 - Unauthorized")
		return
	}

	var plugin Plugin

	// Try to decode the request body into the struct. If there is an error,
	// respond to the client with the error message and a 400 status code.
	err = json.NewDecoder(r.Body).Decode(&plugin)
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

	_, err = db.Exec(`
		UPDATE "plugin"
			SET "name"=$1, "description"=$2, "publisherId"=$3, "publishedAt"=$4, "plugin"=$5, "version"=$6, "compatibleWith"=$7
		WHERE "id"=$8`,
		plugin.Name, plugin.Description, plugin.PublisherId, plugin.PublishedAt, plugin.Plugin, version+1, plugin.CompatibleWith, id,
	)

	if err != nil {
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
