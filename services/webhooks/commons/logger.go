package commons

import (
	"fmt"
	"log"
	"net/http"
	"services/webhooks/debug"
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

func Log(message string) {
	t := time.Now()
	fmt.Printf("%s %s\n",
		t.Format("02/Jan/2006:15:04:05 -0700"),
		message,
	)
}

func Debug(message string) {
	if debug.IsDEV() {
		t := time.Now()
		fmt.Printf("[DEBUG] %s %s\n",
			t.Format("02/Jan/2006:15:04:05 -0700"),
			message,
		)
	}
}

func Logger(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t := time.Now()
		interceptWriter := wrapResponseWriter(w)

		handler.ServeHTTP(interceptWriter, r)

		userId := r.Header.Get("sogebot-event-userid")
		if userId != "" {
			log.Printf("[%s - %s] #%s \"%s %s %s\" %d %s %dus\n",
				r.RemoteAddr,
				t.Format("02/Jan/2006:15:04:05 -0700"),
				userId,
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
