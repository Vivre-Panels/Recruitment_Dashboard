package main

import (
	"fmt"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"recruitment-dashboard/backend/config"
	"recruitment-dashboard/backend/database"
	"recruitment-dashboard/backend/handlers"
)

func main() {
	cfg := config.Load()
	database.Connect(cfg)
	defer database.Close()

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOriginFunc:     func(origin string) bool { return true },
		AllowMethods:        []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:        []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:       []string{"Content-Length"},
		AllowCredentials:    true,
		AllowPrivateNetwork: true,
		MaxAge:              12 * time.Hour,
	}))
	router.SetTrustedProxies(nil)

	api := router.Group("/recruit_api")
	{
		api.GET("/requisitions", handlers.GetRequisitions)
		api.POST("/requisition", handlers.CreateRequisition)
		api.GET("/applications", handlers.GetApplications)
		api.POST("/application", handlers.CreateApplication)
		api.GET("/summary", handlers.GetSummary)
		// api.POST("/call", handlers.CreateCall)
		api.POST("/calls", handlers.CreateCall)
		api.GET("/calls", handlers.GetCalls)
		api.GET("/metrics", handlers.GetMetrics)
		api.GET("/recruiters", handlers.GetRecruiters)
		api.POST("/recruiter", handlers.CreateRecruiter)
		api.POST("/sync-call-durations", handlers.SyncCallDurations)

		// New Management, Control Tower & Analytics GET Endpoints
		api.GET("/kpis/overview", handlers.GetOverviewKPIs)
		api.GET("/control-tower", handlers.GetControlTower)
		api.GET("/funnel-metrics", handlers.GetFunnelMetrics)
		api.GET("/sla/summary", handlers.GetSLASummary)
		api.GET("/metrics/scorecard", handlers.GetScorecard)
		api.GET("/retention/metrics", handlers.GetRetentionMetrics)
		api.GET("/talent-bank", handlers.GetTalentBank)
		api.GET("/reports/weekly-review", handlers.GetWeeklyReviewReport)
		api.GET("/recruiter-insights", handlers.GetRecruiterInsights)
	}

	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	fmt.Printf("Server starting on %s\n", addr)
	router.Run(addr)
}
