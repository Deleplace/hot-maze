package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/storage"
	hotmaze "github.com/Deleplace/hot-maze/B1"
	"golang.org/x/net/context"
)

const (
	projectID = "hot-maze"
	// "b1" is the version of this App Engine app
	// "uc.r" is the app location (regional route)
	backendBaseURL          = "https://b1-dot-hot-maze.uc.r.appspot.com"
	storageServiceAccountID = "ephemeral-storage@hot-maze.iam.gserviceaccount.com"
	bucket                  = "hot-maze.appspot.com"
	fileDeleteAfter         = 9 * time.Minute
)

func main() {
	ctx := context.Background()
	storageClient, err := storage.NewClient(ctx)
	if err != nil {
		log.Fatal("Couldn't create Storage client:", err)
	}

	storagePrivateKey, errSecret := hotmaze.AccessSecretVersion("projects/230384242501/secrets/B1-storage-private-key/versions/latest")
	if errSecret != nil {
		log.Fatal("Couldn't read Storage service account private key:", errSecret)
	}

	server := hotmaze.Server{
		GCPProjectID:        projectID,
		BackendBaseURL:      backendBaseURL,
		StorageClient:       storageClient,
		StorageAccountID:    storageServiceAccountID,
		StoragePrivateKey:   storagePrivateKey,
		StorageBucket:       bucket,
		StorageFileTTL:      fileDeleteAfter,
		CloudTasksQueuePath: "projects/hot-maze/locations/us-central1/queues/b1-file-expiry",
	}
	server.RegisterHandlers()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		log.Printf("Defaulting to port %s", port)
	}

	log.Printf("Listening on port %s", port)
	err = http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
	log.Fatal(err)
}
