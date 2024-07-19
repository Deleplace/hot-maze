package hotmaze

import (
	"fmt"
	"net/http"
	"strings"
)

func (s *Server) accessControlAllowHotMaze(w http.ResponseWriter, r *http.Request) error {
	origin := r.Header.Get("Origin")
	origin = strings.TrimSpace(origin)

	// Specific hosts.
	whiteList := []string{
		"https://hotmaze.io",
		"https://hot-maze-2-3e5dbjxtxq-uc.a.run.app", // needed?
		s.BackendBaseURL,
		// For local testing.
		"http://localhost:8080",
		"http://localhost:8000",
	}
	for _, whiteItem := range whiteList {
		if origin == whiteItem {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			return nil
		}
	}

	return fmt.Errorf("origin %q not in whitelist", origin)
}
