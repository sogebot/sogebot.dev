package routes

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func DeleteOverlayVote(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	vars := mux.Vars(r)

	tx, err := db.Begin()
	if err != nil {
		log.Fatal(err)
	}

	// delete votes
	_, err = tx.Exec(`DELETE FROM "overlay_vote" WHERE "overlayId"=$1 AND "userId"=$2`, vars["id"], r.Header.Get("userId"))
	if err != nil {
		tx.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Print(err)
		fmt.Fprint(w, "500 - Internal server error")
		return
	}

	tx.Commit()

	w.Header().Add("content-type", "application/json")
	w.WriteHeader(http.StatusNoContent)
}
