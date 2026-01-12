package hotmaze

import (
	"fmt"
	"net/http"
	"strings"
)

func (s Server) accessControlAllowHotMaze(w http.ResponseWriter, r *http.Request) error {
	w.Header().Add("Vary", "Origin")
	origin := r.Header.Get("Origin")
	origin = strings.TrimSpace(origin)

	// Specific hosts.
	whiteList := []string{
		"https://hot-maze.appspot.com",
		"https://hot-maze.uc.r.appspot.com",
		"https://d1-dot-hot-maze.uc.r.appspot.com",
		// For debug.
		"http://localhost:8080",
		"http://localhost:8000",
	}
	for _, whiteItem := range whiteList {
		if origin == whiteItem {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			return nil
		}
	}

	return fmt.Errorf("Origin %q not in whitelist", origin)
}
