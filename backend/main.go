package main

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"recruitment-dashboard/backend/auth"
	"recruitment-dashboard/backend/config"
	"recruitment-dashboard/backend/database"
	"recruitment-dashboard/backend/handlers"
)

func main() {
	cfg := config.Load()
	if len(cfg.AuthTokenSecret) < 32 {
		log.Fatal("AUTH_TOKEN_SECRET must be configured with at least 32 characters before starting the API")
	}
	if len(cfg.AllowedOrigins) == 0 {
		log.Fatal("AUTH_ALLOWED_ORIGINS must contain at least one trusted frontend origin")
	}
	database.Connect(cfg)
	defer database.Close()
	authHandler := handlers.NewAuthHandler(cfg)
	if err := authHandler.BootstrapSuperadmin(); err != nil {
		log.Fatalf("Could not bootstrap superadmin account: %v", err)
	}
	if cfg.SuperadminEmail == "" {
		log.Print("No SUPERADMIN_EMAIL configured; dashboard superadmin account was not bootstrapped.")
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			for _, allowed := range cfg.AllowedOrigins {
				if strings.TrimRight(origin, "/") == allowed {
					return true
				}
			}
			return false
		},
		AllowMethods:        []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:        []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:       []string{"Content-Length"},
		AllowCredentials:    true,
		AllowPrivateNetwork: true,
		MaxAge:              12 * time.Hour,
	}))
	router.SetTrustedProxies(nil)

	api := router.Group("/recruit_api")
	api.Use(auth.RequireAllowedOrigin(cfg.AllowedOrigins))
	api.Use(func(c *gin.Context) { c.Header("Cache-Control", "no-store"); c.Next() })
	{
		api.POST("/auth/login", auth.RateLimit(10, time.Minute), authHandler.Login)

		protected := api.Group("")
		protected.Use(auth.Middleware(cfg.AuthTokenSecret))
		protected.GET("/auth/me", authHandler.Me)
		protected.POST("/auth/logout", authHandler.Logout)
		protected.GET("/applications", handlers.GetApplications)

		admin := protected.Group("")
		admin.Use(auth.RequireRoles("superadmin"))
		admin.GET("/requisitions", handlers.GetRequisitions)
		admin.GET("/lookups/recruitment", handlers.GetRecruitmentLookups)
		admin.POST("/requisition", handlers.CreateRequisition)
		admin.POST("/application", handlers.CreateApplication)
		admin.GET("/summary", handlers.GetSummary)
		// api.POST("/call", handlers.CreateCall)
		admin.POST("/calls", handlers.CreateCall)
		admin.GET("/calls", handlers.GetCalls)
		admin.GET("/metrics", handlers.GetMetrics)
		admin.GET("/recruiters", handlers.GetRecruiters)
		admin.GET("/employees", handlers.GetEmployees)
		admin.POST("/employees/superadmin", handlers.CreateSuperadmin)
		admin.POST("/recruiter", handlers.CreateRecruiter)
		admin.POST("/sync-call-durations", handlers.SyncCallDurations)

		// New Management, Control Tower & Analytics GET Endpoints
		admin.GET("/kpis/overview", handlers.GetOverviewKPIs)
		admin.GET("/control-tower", handlers.GetControlTower)
		admin.GET("/funnel-metrics", handlers.GetFunnelMetrics)
		admin.GET("/sla/summary", handlers.GetSLASummary)
		admin.GET("/metrics/scorecard", handlers.GetScorecard)
		admin.GET("/retention/metrics", handlers.GetRetentionMetrics)
		admin.GET("/talent-bank", handlers.GetTalentBank)
		admin.GET("/reports/weekly-review", handlers.GetWeeklyReviewReport)
		admin.GET("/recruiter-insights", handlers.GetRecruiterInsights)
	}

	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	fmt.Printf("Server starting on %s\n", addr)
	router.Run(addr)
}
