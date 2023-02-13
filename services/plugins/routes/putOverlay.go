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

func PutOverlay(w http.ResponseWriter, r *http.Request, db *sql.DB, validate *validator.Validate) {
	vars := mux.Vars(r)

	headerContentTtype := r.Header.Get("Content-Type")
	if headerContentTtype != "application/x-www-form-urlencoded" {
		w.WriteHeader(http.StatusUnsupportedMediaType)
		return
	}
	r.ParseForm()

	t := time.Now()

	var (
		id          string
		name        string
		version     int
		publisherId string
	)
	err := db.QueryRow(`
		SELECT "id", "name", "version", "publisherId" FROM "overlay" WHERE "id"=$1
	`, vars["id"]).Scan(&id, &name, &version, &publisherId)
	if err != nil || err == sql.ErrNoRows {
		fmt.Println(err)
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, "404 - Overlay not found")
		return
	}
	if publisherId != r.Header.Get("userId") {
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, "401 - Unauthorized")
		return
	}

	overlay := Overlay{
		OverlayStripped: &OverlayStripped{
			Id:             id,
			Name:           name, // name is not changeable
			Description:    r.FormValue("description"),
			PublisherId:    r.Header.Get("userId"),
			PublishedAt:    t.Format("2006-01-02T15:04:05.999Z"),
			Version:        version + 1,
			CompatibleWith: r.FormValue("compatibleWith"),
			Votes:          []OverlayVote{},
		},
		Overlay: r.FormValue("overlay"),
	}

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

	_, err = db.Exec(`
		UPDATE "overlay"
			SET "name"=$1, "description"=$2, "publisherId"=$3, "publishedAt"=$4, "overlay"=$5, "version"=$6, "compatibleWith"=$7
		WHERE "id"=$8`,
		overlay.Name, overlay.Description, overlay.PublisherId, overlay.PublishedAt, overlay.Overlay, overlay.Version, overlay.CompatibleWith, overlay.Id,
	)

	if err != nil {
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
