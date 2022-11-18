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
	Id             string       `json:"id"`
	Name           string       `json:"name" validate:"required,min=4"`
	Description    string       `json:"description" validate:"required,min=4"`
	PublisherId    string       `json:"publisherId" validate:"required"`
	PublishedAt    string       `json:"publishedAt" validate:"required"`
	Plugin         string       `json:"plugin" validate:"required"`
	Version        int          `json:"version" validate:"required,numeric"`
	ImportedCount  int          `json:"importedCount"`
	CompatibleWith string       `json:"compatibleWith" validate:"required"`
	Votes          []PluginVote `json:"votes"`
}

type error struct {
	Path  string `json:"path"`
	Error string `json:"error"`
	Param string `json:"param"`
}

func PostPlugin(w http.ResponseWriter, r *http.Request, db *sql.DB, validate *validator.Validate) {
	headerContentTtype := r.Header.Get("Content-Type")
	if headerContentTtype != "application/x-www-form-urlencoded" {
		w.WriteHeader(http.StatusUnsupportedMediaType)
		return
	}
	r.ParseForm()

	t := time.Now()

	plugin := Plugin{
		Name:           r.FormValue("name"),
		Description:    r.FormValue("description"),
		PublisherId:    r.Header.Get("userId"),
		PublishedAt:    t.Format("2006-01-02T15:04:05.999Z"),
		Plugin:         r.FormValue("plugin"),
		Version:        1,
		CompatibleWith: r.FormValue("compatibleWith"),
		Votes:          []PluginVote{},
	}

	err := validate.Struct(plugin)
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
		plugin.Name, plugin.Description, plugin.PublisherId, plugin.PublishedAt, plugin.Plugin, plugin.Version, plugin.CompatibleWith,
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
