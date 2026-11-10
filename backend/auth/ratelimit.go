package auth

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type requestWindow struct {
	started time.Time
	count   int
}

func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	var mu sync.Mutex
	clients := make(map[string]requestWindow)
	return func(c *gin.Context) {
		now := time.Now()
		key := c.ClientIP()
		mu.Lock()
		entry := clients[key]
		if entry.started.IsZero() || now.Sub(entry.started) >= window {
			entry = requestWindow{started: now}
		}
		entry.count++
		clients[key] = entry
		if len(clients) > 10000 {
			for client, value := range clients {
				if now.Sub(value.started) >= window {
					delete(clients, client)
				}
			}
		}
		blocked := entry.count > limit
		mu.Unlock()
		if blocked {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"success": false, "message": "Too many requests. Please wait and try again."})
			return
		}
		c.Next()
	}
}
