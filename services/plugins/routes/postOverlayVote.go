package routes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/gorilla/mux"
)

func PostOverlayVote(w http.ResponseWriter, r *http.Request, db *sql.DB, validate *validator.Validate) {
	vars := mux.Vars(r)

	headerContentTtype := r.Header.Get("Content-Type")
	if headerContentTtype != "application/x-www-form-urlencoded" {
		w.WriteHeader(http.StatusUnsupportedMediaType)
		return
	}
	r.ParseForm()

	voteInteger, err := strconv.Atoi(r.FormValue("vote"))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Print(err)
		fmt.Fprint(w, "500 - Internal server error")
		return
	}

	overlayVote := OverlayVote{
		Vote:   voteInteger,
		UserId: r.Header.Get("userId"),
	}

	err = validate.Struct(overlayVote)
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

	tx, err := db.Begin()
	if err != nil {
		log.Fatal(err)
	}

	_, err = tx.Exec(`DELETE FROM "overlay_vote" WHERE "userId"=$1 AND "overlayId"=$2`, overlayVote.UserId, vars["id"])
	if err != nil {
		fmt.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "500 - Internal server error")
		return
	}

	err = tx.QueryRow(`
		INSERT INTO "overlay_vote" ("userId", "vote", "overlayId")
		VALUES ($1, $2, $3)
		RETURNING "id"`,
		overlayVote.UserId, overlayVote.Vote, vars["id"],
	).Scan(&overlayVote.Id)

	tx.Commit()

	if err != nil || err == sql.ErrNoRows {
		fmt.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "500 - Internal server error")
		return
	}

	if f, err := json.Marshal(overlayVote); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Print(err)
		fmt.Fprint(w, "500 - Internal server error")
	} else {
		w.Header().Add("content-type", "application/json")
		w.WriteHeader(200)
		fmt.Fprint(w, string(f))
	}
}
