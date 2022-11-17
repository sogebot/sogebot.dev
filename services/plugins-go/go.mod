module services/plugins

go 1.19

require (
	github.com/gorilla/mux v1.8.0
	github.com/lib/pq v1.10.7
)

require internal/logger v0.0.0-00010101000000-000000000000 // indirect

replace internal/logger => ./internal/logger
