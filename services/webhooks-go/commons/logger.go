package commons

import (
	"log"
	"net/http"
	"time"
)

type responseWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func wrapResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{ResponseWriter: w}
}

func (rw *responseWriter) Status() int {
	return rw.status
}

func (rw *responseWriter) WriteHeader(code int) {
	if rw.wroteHeader {
		return
	}
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
	rw.wroteHeader = true
}

func Logger(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t := time.Now()
		interceptWriter := wrapResponseWriter(w)

		handler.ServeHTTP(interceptWriter, r)

		channel := r.Header.Get("SogeBot-Channel")
		owners := r.Header.Get("SogeBot-Owners")

		if channel != "" && owners != "" {
			log.Printf("[%s - %s] #%s[%s] \"%s %s %s\" %d %s %dus\n",
				r.RemoteAddr,
				t.Format("02/Jan/2006:15:04:05 -0700"),
				channel,
				owners,
				r.Method,
				r.URL.Path,
				r.Proto,
				interceptWriter.status,
				r.UserAgent(),
				time.Since(t),
			)

		} else {
			log.Printf("[%s - %s] \"%s %s %s\" %d %s %dus\n",
				r.RemoteAddr,
				t.Format("02/Jan/2006:15:04:05 -0700"),
				r.Method,
				r.URL.Path,
				r.Proto,
				interceptWriter.status,
				r.UserAgent(),
				time.Since(t),
			)
		}
	})
}
