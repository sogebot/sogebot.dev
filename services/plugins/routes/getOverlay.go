package routes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

func GetOverlay(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	vars := mux.Vars(r)

	_, err := db.Exec(`UPDATE "overlay" SET "importedCount" = "importedCount" + 1 WHERE "id"=$1`, vars["id"])
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, "400 - Invalid format of UUID supplied.")
		return
	}

	row := db.QueryRow(`
		SELECT   P.*, COALESCE(json_agg(C) FILTER (WHERE C."userId" IS NOT NULL), '[]') AS votes
			FROM        "overlay" P
			LEFT JOIN  "overlay_vote"  C
			ON      C."overlayId" = P."id"
			WHERE P."id"=$1
			GROUP BY P."id"
	`, vars["id"])

	var (
		id             string
		name           string
		description    string
		publisherId    string
		publishedAt    string
		overlay        string
		version        int
		importedCount  int
		compatibleWith string
		votesJSON      string
		/* data string - images etc.*/

		data Overlay
	)

	err = row.Scan(&id, &name, &description, &publisherId, &publishedAt, &version, &overlay, &importedCount, &compatibleWith, &votesJSON)
	if err != nil || err == sql.ErrNoRows {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, "404 - Overlay not found")
	} else {
		// unmarshal votes
		votes := []OverlayVote{}
		json.Unmarshal([]byte(votesJSON), &votes)

		data = Overlay{
			OverlayStripped: &OverlayStripped{
				Id: id, Name: name, Description: description, PublisherId: publisherId, PublishedAt: publishedAt, Version: version, ImportedCount: importedCount, CompatibleWith: compatibleWith, Votes: votes,
			},
			Overlay: overlay,
		}

		if f, err := json.Marshal(data); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Print(err)
			fmt.Fprint(w, "500 - Internal server error")
		} else {
			w.Header().Add("content-type", "application/json")
			w.WriteHeader(200)
			fmt.Fprint(w, string(f))
		}
	}
}
