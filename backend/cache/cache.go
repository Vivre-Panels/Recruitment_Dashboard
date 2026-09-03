package cache

import (
	"sync"
	"time"
)

type CacheItem struct {
	Data      interface{}
	Timestamp time.Time
}

var (
	store = make(map[string]CacheItem)
	mu    sync.RWMutex
)

func Get(key string, ttl time.Duration) (interface{}, bool) {
	mu.RLock()
	defer mu.RUnlock()
	item, found := store[key]
	if !found {
		return nil, false
	}
	if time.Since(item.Timestamp) > ttl {
		return nil, false
	}
	return item.Data, true
}

func Set(key string, data interface{}) {
	mu.Lock()
	defer mu.Unlock()
	store[key] = CacheItem{
		Data:      data,
		Timestamp: time.Now(),
	}
}

func Invalidate() {
	mu.Lock()
	defer mu.Unlock()
	store = make(map[string]CacheItem)
}
