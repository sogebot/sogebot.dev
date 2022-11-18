package routes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

type PluginStripped struct {
	Id             string       `json:"id"`
	Name           string       `json:"name"`
	Description    string       `json:"description"`
	PublisherId    string       `json:"publisherId"`
	PublishedAt    string       `json:"publishedAt"`
	Version        int          `json:"version"`
	ImportedCount  int          `json:"importedCount"`
	CompatibleWith string       `json:"compatibleWith"`
	Votes          []PluginVote `json:"votes"`
}

type PluginVote struct {
	Id     string `json:"id"`
	UserId string `json:"userId" validate:"required,numeric"`
	Vote   int    `json:"vote" validate:"required,numeric,gte=-1,ne=0,lte=1"`
}

func GetPlugins(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	rows, err := db.Query(`
		SELECT   P."id", P."name", P."description", P."publisherId", P."publishedAt", P."version", P."importedCount", P."compatibleWith", COALESCE(json_agg(C) FILTER (WHERE C."userId" IS NOT NULL), '[]') AS votes
			FROM        "plugin" P
			LEFT JOIN  "plugin_vote"  C
					ON      C."pluginId" = P."id"
			GROUP BY P."id"
	`)
	defer rows.Close()

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Print(err)
		fmt.Fprint(w, "500 - Internal server error")
		return
	}

	var (
		id             string
		name           string
		description    string
		publisherId    string
		publishedAt    string
		version        int
		importedCount  int
		compatibleWith string
		votesJSON      string

		data []PluginStripped
	)
	for rows.Next() {
		rows.Scan(&id, &name, &description, &publisherId, &publishedAt, &version, &importedCount, &compatibleWith, &votesJSON)

		// unmarshal votes
		votes := []PluginVote{}
		json.Unmarshal([]byte(votesJSON), &votes)

		data = append(data, PluginStripped{
			Id: id, Name: name, Description: description, PublisherId: publisherId, PublishedAt: publishedAt, Version: version, ImportedCount: importedCount, CompatibleWith: compatibleWith, Votes: votes,
		})
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
