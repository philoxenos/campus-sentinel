package main

import (
	"log"
	"os"

	"campus-sentinel/backend/internal/database"
	"campus-sentinel/backend/internal/handler"
	"campus-sentinel/backend/internal/middleware"
	"campus-sentinel/backend/internal/model"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("==================================================")
	log.Println(" Starting Campus Sentinel API Backend (Go/Gin)")
	log.Println(" School Behavioral Monitoring & Early Warning")
	log.Println("==================================================")

	// Initialize Database (MySQL with SQLite automatic fallback)
	database.InitDB()

	r := gin.Default()

	// CORS Config
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	r.Use(cors.New(config))

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"system":  "Campus Sentinel",
			"version": "1.0.0-prototype",
		})
	})

	api := r.Group("/api")
	{
		// 1. Public Authentication Endpoints
		auth := api.Group("/auth")
		{
			auth.POST("/login", handler.Login)
			auth.POST("/google", handler.GoogleAuth)
			auth.GET("/demo-switch", handler.DemoSwitch)
		}

		// 2. Public Incident & Concern Reporting (No login required)
		public := api.Group("/public")
		{
			public.POST("/incident-report", handler.SubmitPublicIncident)
			public.GET("/incident-report/:code", handler.TrackPublicIncident)
		}

		// 3. Public / Universal Daily Widget
		api.GET("/daily-widget", handler.GetDailyWidget)

		// Authenticated Routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/auth/me", handler.GetMe)

			// Kudos Wall
			protected.GET("/kudos", handler.GetKudos)
			protected.POST("/kudos", handler.CreateKudos)

			// Vent Space
			protected.GET("/vent/thread", handler.GetVentThread)
			protected.POST("/vent/message", handler.SendVentMessage)
			protected.PUT("/vent/comfort-preference", handler.UpdateComfortPreference)

			// Daily Mood Check-In
			protected.GET("/mood/calendar", handler.GetMoodCalendar)
			protected.POST("/mood/check-in", handler.SubmitMoodCheckIn)

			// Classes & Attendance
			protected.GET("/classes", handler.GetClasses)
			protected.GET("/classes/:id/students", handler.GetClassStudents)
			protected.GET("/attendance", handler.GetAttendance)
			protected.POST("/attendance", handler.RecordAttendance)

			// Behavioral Observations
			protected.GET("/observations", handler.GetObservations)
			protected.POST("/observations", handler.CreateObservation)

			// Guidance Counselor & Admin Access
			counselor := protected.Group("/")
			counselor.Use(middleware.RequireRole(model.RoleCounselor, model.RoleGLC, model.RoleSuperAdmin))
			{
				counselor.GET("/incidents", handler.GetIncidents)
				counselor.PUT("/incidents/:id/status", handler.UpdateIncidentStatus)

				counselor.GET("/dashboard/stats", handler.GetDashboardStats)
				counselor.GET("/dashboard/risk-matrix", handler.GetRiskMatrix)
				counselor.GET("/dashboard/student/:id", handler.GetStudentBehavioralProfile)

				counselor.GET("/cases", handler.GetCases)
				counselor.POST("/cases", handler.CreateCase)
				counselor.PUT("/cases/:id", handler.UpdateCase)

				counselor.GET("/reports/export-csv", handler.ExportCSV)
			}

			// Super Admin Access
			admin := protected.Group("/")
			admin.Use(middleware.RequireRole(model.RoleSuperAdmin))
			{
				admin.GET("/users", handler.GetUsers)
				admin.PUT("/users/:id/role", handler.UpdateUserRole)
				admin.GET("/audit-logs", handler.GetAuditLogs)
			}
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[Server] Listening on http://localhost:%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}
