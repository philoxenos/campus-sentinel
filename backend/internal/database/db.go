package database

import (
	"log"
	"os"

	"campus-sentinel/backend/internal/model"
	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB initializes the database connection, falling back gracefully to SQLite if MySQL is unreachable.
func InitDB() *gorm.DB {
	var err error
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		dsn = "root:@tcp(127.0.0.1:3306)/campus_sentinel?charset=utf8mb4&parseTime=True&loc=Local"
	}

	log.Println("[Database] Attempting connection to MySQL at:", dsn)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})

	if err != nil {
		log.Printf("[Database Warning] Could not connect to MySQL (%v). Falling back to SQLite local storage for zero-friction setup.\n", err)
		sqliteDBPath := "campus_sentinel.db"
		db, err = gorm.Open(sqlite.Open(sqliteDBPath), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Warn),
		})
		if err != nil {
			log.Fatalf("[Database Fatal] Failed to open fallback SQLite database: %v", err)
		}
		log.Println("[Database] Successfully connected to SQLite storage at:", sqliteDBPath)
	} else {
		log.Println("[Database] Successfully connected to MySQL database!")
	}

	DB = db

	// Run Auto-Migrations
	log.Println("[Database] Running auto-migrations...")
	err = db.AutoMigrate(
		&model.User{},
		&model.Class{},
		&model.StudentProfile{},
		&model.KudosPost{},
		&model.VentThread{},
		&model.VentMessage{},
		&model.DailyMood{},
		&model.DailyWidget{},
		&model.AttendanceLog{},
		&model.BehavioralObservation{},
		&model.IncidentReport{},
		&model.RiskEvaluation{},
		&model.CounselingCase{},
		&model.AuditLog{},
	)
	if err != nil {
		log.Fatalf("[Database Fatal] Auto-migration failed: %v", err)
	}

	// Seed synthetic demonstration dataset
	SeedSyntheticData(db)

	return db
}
