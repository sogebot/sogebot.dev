package routes

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func DeletePlugin(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	vars := mux.Vars(r)

	tx, err := db.Begin()
	if err != nil {
		log.Fatal(err)
	}

	// delete plugin
	res, err := tx.Exec(`DELETE FROM "plugin" WHERE "id"=$1 AND "publisherId"=$2`, vars["id"], r.Header.Get("userId"))
	if err != nil {
		tx.Rollback()
		fmt.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "500 - Internal server error")
		return
	}
	count, err := res.RowsAffected()
	if err != nil {
		tx.Rollback()
		fmt.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, "500 - Internal server error")
		return
	}
	if count == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, "401 - Unauthorized")
		tx.Rollback()
		return;
	}

	// delete votes
	_, err = tx.Exec(`DELETE FROM "plugin_vote" WHERE "pluginId"=$1`, vars["id"])
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
