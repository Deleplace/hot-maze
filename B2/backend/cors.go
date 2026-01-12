package hotmaze

import (
	"fmt"
	"net/http"
	"strings"
)

// CORS
func (s Server) accessControlAllowHotMaze(w http.ResponseWriter, r *http.Request) error {
	w.Header().Add("Vary", "Origin")
	origin := r.Header.Get("Origin")
	origin = strings.TrimSpace(origin)

	// Specific hosts.
	whiteList := []string{
		"https://hotmaze.io",
		"https://hot-maze.firebaseapp.com",
		"https://hot-maze.web.app",
		// For local testing.
		"http://localhost:8080",
		"http://localhost:8081",
		"",
	}
	for _, whiteItem := range whiteList {
		if origin == whiteItem {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			return nil
		}
	}

	return fmt.Errorf("Origin %q not in whitelist", origin)
}
