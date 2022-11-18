package routes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

func GetPlugin(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	vars := mux.Vars(r)

	_, err := db.Exec(`UPDATE "plugin" SET "importedCount" = "importedCount" + 1 WHERE "id"=$1`, vars["id"])
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, "400 - Invalid format of UUID supplied.")
		return
	}

	row := db.QueryRow(`
		SELECT   P.*, COALESCE(json_agg(C) FILTER (WHERE C."userId" IS NOT NULL), '[]') AS votes
			FROM        "plugin" P
			LEFT JOIN  "plugin_vote"  C
			ON      C."pluginId" = P."id"
			WHERE P."id"=$1
			GROUP BY P."id"
	`, vars["id"])

	var (
		id             string
		name           string
		description    string
		publisherId    string
		publishedAt    string
		plugin         string
		version        int
		importedCount  int
		compatibleWith string
		votesJSON      string

		data Plugin
	)

	err = row.Scan(&id, &name, &description, &publisherId, &publishedAt, &version, &plugin, &importedCount, &compatibleWith, &votesJSON)
	if err != nil || err == sql.ErrNoRows {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, "404 - Plugin not found")
	} else {
		// unmarshal votes
		votes := []PluginVote{}
		json.Unmarshal([]byte(votesJSON), &votes)

		data = Plugin{
			PluginStripped: &PluginStripped{
				Id: id, Name: name, Description: description, PublisherId: publisherId, PublishedAt: publishedAt, Version: version, ImportedCount: importedCount, CompatibleWith: compatibleWith, Votes: votes,
			},
			Plugin: plugin,
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
