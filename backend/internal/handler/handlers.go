package handler

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"campus-sentinel/backend/internal/database"
	"campus-sentinel/backend/internal/middleware"
	"campus-sentinel/backend/internal/model"
	"campus-sentinel/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// -------------------------------------------------------------
// Authentication Handlers
// -------------------------------------------------------------

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email and password are required"})
		return
	}

	var user model.User
	if err := database.DB.Where("email = ? AND is_active = ?", req.Email, true).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := middleware.GenerateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate authorization token"})
		return
	}

	middleware.LogAuditAction(c, "LOGIN", "Auth", &user.ID, fmt.Sprintf("Logged in via password: %s", user.Email))

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

type GoogleAuthRequest struct {
	Email     string `json:"email" binding:"required"`
	GoogleID  string `json:"google_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	AvatarURL string `json:"avatar_url"`
}

// GoogleAuth handles Google OAuth sign-in. Per user requirement:
// "Not locked on specific domain, any google account will do as long as it is registered in the website under user management."
func GoogleAuth(c *gin.Context) {
	var req GoogleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Google payload"})
		return
	}

	var user model.User
	if err := database.DB.Where("email = ? AND is_active = ?", req.Email, true).First(&user).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "This Google account is not pre-registered in the school directory. Please contact the System Administrator to enroll your account.",
		})
		return
	}

	// Update Google details if available
	if req.GoogleID != "" && user.GoogleID == "" {
		user.GoogleID = req.GoogleID
	}
	if req.AvatarURL != "" {
		user.AvatarURL = req.AvatarURL
	}
	database.DB.Save(&user)

	token, err := middleware.GenerateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	middleware.LogAuditAction(c, "LOGIN", "Auth", &user.ID, fmt.Sprintf("Google OAuth sign-in: %s", user.Email))

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

// DemoSwitch provides 1-click role switcher for presentations and testing.
func DemoSwitch(c *gin.Context) {
	roleKey := c.Query("role")
	var targetEmail string

	switch roleKey {
	case "super_admin":
		targetEmail = "admin@sentinel.edu"
	case "counselor":
		targetEmail = "counselor.santos@sentinel.edu"
	case "teacher":
		targetEmail = "adviser.cruz@sentinel.edu"
	case "student_juan":
		targetEmail = "student.juan@sentinel.edu"
	case "student_miguel":
		targetEmail = "student.miguel@sentinel.edu"
	case "student_althea":
		targetEmail = "student.althea@sentinel.edu"
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown demo role"})
		return
	}

	var user model.User
	if err := database.DB.Preload("StudentProfile.Class").Where("email = ?", targetEmail).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Demo user not found"})
		return
	}

	token, err := middleware.GenerateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

func GetMe(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var user model.User
	if err := database.DB.Preload("StudentProfile.Class").Preload("StudentProfile.AssignedCounselor").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// -------------------------------------------------------------
// Kudos Wall Handlers
// -------------------------------------------------------------

func GetKudos(c *gin.Context) {
	var posts []model.KudosPost
	database.DB.Preload("Sender").Order("created_at desc").Limit(50).Find(&posts)
	c.JSON(http.StatusOK, posts)
}

type CreateKudosRequest struct {
	RecipientName string `json:"recipient_name"`
	Message       string `json:"message" binding:"required"`
	Category      string `json:"category"`
}

func CreateKudos(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req CreateKudosRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message is required"})
		return
	}

	// Filter for violent/harmful/profane words
	if err := service.CheckHarmfulContent(req.Message); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "Harmful words detected. The Kudos Wall is reserved for uplifting messages only.",
		})
		return
	}

	cat := req.Category
	if cat == "" {
		cat = "APPRECIATION"
	}

	post := model.KudosPost{
		SenderID:      userID,
		RecipientName: req.RecipientName,
		Message:       req.Message,
		Category:      cat,
		CreatedAt:     time.Now(),
	}

	database.DB.Create(&post)
	database.DB.Preload("Sender").First(&post, post.ID)

	c.JSON(http.StatusCreated, post)
}

// -------------------------------------------------------------
// Vent Space Handlers (Confidential 1-on-1 Student to Counselor)
// -------------------------------------------------------------

func GetVentThread(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	role := c.MustGet("userRole").(model.Role)

	var thread model.VentThread

	if role == model.RoleStudent {
		err := database.DB.Preload("Messages.Sender").
			Preload("Counselor").
			Where("student_id = ?", userID).
			First(&thread).Error

		if err != nil {
			// Find assigned counselor or default counselor
			var profile model.StudentProfile
			database.DB.Where("user_id = ?", userID).First(&profile)
			counselorID := uint(2) // fallback default counselor
			if profile.AssignedCounselorID != nil {
				counselorID = *profile.AssignedCounselorID
			}

			thread = model.VentThread{
				StudentID:         userID,
				CounselorID:       counselorID,
				ComfortPreference: "INSPIRATIONAL_QUOTE",
				Status:            "OPEN",
			}
			database.DB.Create(&thread)
			database.DB.Preload("Counselor").First(&thread, thread.ID)
		}
		c.JSON(http.StatusOK, thread)
		return
	}

	// For Counselor / Admin: query by student_id param
	studentIDParam := c.Query("student_id")
	if studentIDParam == "" {
		// Return list of all vent threads handled by this counselor
		var threads []model.VentThread
		database.DB.Preload("Student").
			Preload("Messages").
			Where("counselor_id = ?", userID).
			Order("updated_at desc").
			Find(&threads)
		c.JSON(http.StatusOK, threads)
		return
	}

	sid, _ := strconv.ParseUint(studentIDParam, 10, 32)
	err := database.DB.Preload("Messages.Sender").
		Preload("Student").
		Preload("Counselor").
		Where("student_id = ?", uint(sid)).
		First(&thread).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No vent thread found for this student"})
		return
	}

	middleware.LogAuditAction(c, "VIEW_VENT_SPACE", "VentThread", &thread.ID, fmt.Sprintf("Counselor viewed vent thread of student #%d", sid))
	c.JSON(http.StatusOK, thread)
}

type SendVentMessageRequest struct {
	ThreadID uint   `json:"thread_id" binding:"required"`
	Message  string `json:"message" binding:"required"`
}

func SendVentMessage(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req SendVentMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message is required"})
		return
	}

	var thread model.VentThread
	if err := database.DB.First(&thread, req.ThreadID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vent thread not found"})
		return
	}

	msg := model.VentMessage{
		ThreadID:  req.ThreadID,
		SenderID:  userID,
		Message:   req.Message,
		CreatedAt: time.Now(),
	}
	database.DB.Create(&msg)

	// Update thread updated_at
	thread.UpdatedAt = time.Now()
	if userID == thread.CounselorID {
		thread.Status = "COUNSELOR_REPLIED"
	}
	database.DB.Save(&thread)

	database.DB.Preload("Sender").First(&msg, msg.ID)
	c.JSON(http.StatusCreated, msg)
}

type UpdateComfortPrefRequest struct {
	Preference string `json:"preference" binding:"required"` // BIBLE_VERSE, INSPIRATIONAL_QUOTE, MINDFULNESS
}

func UpdateComfortPreference(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req UpdateComfortPrefRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Preference required"})
		return
	}

	database.DB.Model(&model.VentThread{}).Where("student_id = ?", userID).Update("comfort_preference", req.Preference)
	c.JSON(http.StatusOK, gin.H{"message": "Comfort preference updated successfully", "preference": req.Preference})
}

// -------------------------------------------------------------
// Daily Widget (Verse / Word of the Day)
// -------------------------------------------------------------

func GetDailyWidget(c *gin.Context) {
	today := time.Now().Format("2006-01-02")
	var widget model.DailyWidget
	err := database.DB.Where("display_date = ?", today).First(&widget).Error
	if err != nil {
		// Fallback to most recent widget
		database.DB.Order("display_date desc").First(&widget)
	}
	c.JSON(http.StatusOK, widget)
}

// -------------------------------------------------------------
// Daily Mood Check-In Handlers (Interactive Calendar)
// -------------------------------------------------------------

func GetMoodCalendar(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	role := c.MustGet("userRole").(model.Role)

	targetID := userID
	if (role == model.RoleCounselor || role == model.RoleSuperAdmin) && c.Query("student_id") != "" {
		sid, _ := strconv.ParseUint(c.Query("student_id"), 10, 32)
		targetID = uint(sid)
	}

	var moods []model.DailyMood
	database.DB.Where("student_id = ?", targetID).Order("check_date asc").Find(&moods)
	c.JSON(http.StatusOK, moods)
}

type MoodCheckInRequest struct {
	CheckDate string `json:"check_date" binding:"required"` // YYYY-MM-DD
	Score     int    `json:"score" binding:"required,min=1,max=5"`
	Note      string `json:"note"`
}

func SubmitMoodCheckIn(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req MoodCheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid date and score between 1-5 required"})
		return
	}

	var mood model.DailyMood
	err := database.DB.Where("student_id = ? AND check_date = ?", userID, req.CheckDate).First(&mood).Error
	if err != nil {
		mood = model.DailyMood{
			StudentID: userID,
			CheckDate: req.CheckDate,
			Score:     req.Score,
			Note:      req.Note,
			CreatedAt: time.Now(),
		}
		database.DB.Create(&mood)
	} else {
		mood.Score = req.Score
		mood.Note = req.Note
		database.DB.Save(&mood)
	}

	// Re-evaluate risk score asynchronously
	go func() {
		service.EvaluateStudentRisk(database.DB, userID)
	}()

	c.JSON(http.StatusOK, mood)
}

// -------------------------------------------------------------
// Classes & Attendance Handlers
// -------------------------------------------------------------

func GetClasses(c *gin.Context) {
	var classes []model.Class
	database.DB.Preload("Adviser").Find(&classes)
	c.JSON(http.StatusOK, classes)
}

func GetClassStudents(c *gin.Context) {
	classIDParam := c.Param("id")
	cid, _ := strconv.ParseUint(classIDParam, 10, 32)

	var profiles []model.StudentProfile
	database.DB.Preload("User").
		Where("class_id = ?", uint(cid)).
		Find(&profiles)

	c.JSON(http.StatusOK, profiles)
}

func GetAttendance(c *gin.Context) {
	classIDParam := c.Query("class_id")
	dateParam := c.Query("date")
	if dateParam == "" {
		dateParam = time.Now().Format("2006-01-02")
	}

	var logs []model.AttendanceLog
	q := database.DB.Preload("Student").Preload("RecordedBy").Where("recorded_date = ?", dateParam)
	if classIDParam != "" {
		cid, _ := strconv.ParseUint(classIDParam, 10, 32)
		q = q.Where("class_id = ?", uint(cid))
	}
	q.Find(&logs)
	c.JSON(http.StatusOK, logs)
}

type RecordAttendanceRequest struct {
	StudentID uint   `json:"student_id" binding:"required"`
	ClassID   uint   `json:"class_id" binding:"required"`
	Date      string `json:"date" binding:"required"`
	Status    string `json:"status" binding:"required"` // PRESENT, EXCUSED_ABSENCE, UNEXCUSED_ABSENCE, TARDY, CUTTING_CLASS
	Remarks   string `json:"remarks"`
}

func RecordAttendance(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req RecordAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid attendance fields required"})
		return
	}

	var log model.AttendanceLog
	err := database.DB.Where("student_id = ? AND recorded_date = ?", req.StudentID, req.Date).First(&log).Error
	if err != nil {
		log = model.AttendanceLog{
			StudentID:    req.StudentID,
			ClassID:      req.ClassID,
			RecordedDate: req.Date,
			Status:       req.Status,
			Remarks:      req.Remarks,
			RecordedByID: userID,
			CreatedAt:    time.Now(),
		}
		database.DB.Create(&log)
	} else {
		log.Status = req.Status
		log.Remarks = req.Remarks
		log.RecordedByID = userID
		database.DB.Save(&log)
	}

	// Trigger risk calculation
	go func() {
		service.EvaluateStudentRisk(database.DB, req.StudentID)
	}()

	c.JSON(http.StatusOK, log)
}

// -------------------------------------------------------------
// Behavioral Observations Handlers
// -------------------------------------------------------------

func GetObservations(c *gin.Context) {
	studentIDParam := c.Query("student_id")
	var obs []model.BehavioralObservation
	q := database.DB.Preload("Student").Preload("Observer").Order("created_at desc")
	if studentIDParam != "" {
		sid, _ := strconv.ParseUint(studentIDParam, 10, 32)
		q = q.Where("student_id = ?", uint(sid))
	}
	q.Find(&obs)
	c.JSON(http.StatusOK, obs)
}

type CreateObservationRequest struct {
	StudentID       uint   `json:"student_id" binding:"required"`
	ObservationDate string `json:"observation_date" binding:"required"`
	Category        string `json:"category" binding:"required"`
	Details         string `json:"details" binding:"required"`
	Severity        string `json:"severity" binding:"required"`
}

func CreateObservation(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req CreateObservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All observation fields are required"})
		return
	}

	obs := model.BehavioralObservation{
		StudentID:       req.StudentID,
		ObserverID:      userID,
		ObservationDate: req.ObservationDate,
		Category:        req.Category,
		Details:         req.Details,
		Severity:        req.Severity,
		CreatedAt:       time.Now(),
	}
	database.DB.Create(&obs)

	// Recalculate risk immediately
	go func() {
		service.EvaluateStudentRisk(database.DB, req.StudentID)
	}()

	c.JSON(http.StatusCreated, obs)
}

// -------------------------------------------------------------
// Incident & Concern Reporting Handlers (Public & Authenticated)
// -------------------------------------------------------------

type PublicIncidentRequest struct {
	ReporterType    string `json:"reporter_type" binding:"required"` // STUDENT, TEACHER, PARENT, BYSTANDER_ANONYMOUS
	ReporterContact string `json:"reporter_contact"`
	TargetStudentID *uint  `json:"target_student_id"`
	IncidentDate    string `json:"incident_date" binding:"required"`
	Location        string `json:"location" binding:"required"`
	Category        string `json:"category" binding:"required"`
	Urgency         string `json:"urgency"`
	Narrative       string `json:"narrative" binding:"required"`
}

func SubmitPublicIncident(c *gin.Context) {
	var req PublicIncidentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid incident submission data"})
		return
	}

	incDate, err := time.Parse("2006-01-02", req.IncidentDate)
	if err != nil {
		incDate = time.Now()
	}

	trackingCode := fmt.Sprintf("CS-%d-%s", time.Now().Year(), strings.ToUpper(uuid.New().String()[:6]))

	urgency := req.Urgency
	if urgency == "" {
		urgency = "ROUTINE"
	}

	report := model.IncidentReport{
		TrackingCode:    trackingCode,
		ReporterType:    req.ReporterType,
		ReporterContact: req.ReporterContact,
		TargetStudentID: req.TargetStudentID,
		IncidentDate:    incDate,
		Location:        req.Location,
		Category:        req.Category,
		Urgency:         urgency,
		Narrative:       req.Narrative,
		Status:          "UNVERIFIED",
		CreatedAt:       time.Now(),
	}

	database.DB.Create(&report)

	// If critical urgency or weapon/violence threat, trigger instant email alert!
	if urgency == "CRITICAL_IMMEDIATE" || req.Category == "WEAPON_THREAT" || req.Category == "PHYSICAL_VIOLENCE" {
		var counselors []model.User
		database.DB.Where("role = ?", model.RoleCounselor).Find(&counselors)
		var emails []string
		for _, counselor := range counselors {
			emails = append(emails, counselor.Email)
		}
		summary := fmt.Sprintf("Public Incident Report [%s] filed: Category=%s, Location=%s, Urgency=%s", trackingCode, req.Category, req.Location, urgency)
		service.NotifyAssignedStaffOnCriticalRisk("Undisclosed/Reported Student", trackingCode, summary, emails)
	}

	middleware.LogAuditAction(c, "SUBMIT_INCIDENT", "IncidentReport", &report.ID, fmt.Sprintf("Public report filed: %s", trackingCode))

	c.JSON(http.StatusCreated, gin.H{
		"message":       "Report submitted successfully. Guidance counselors have been notified.",
		"tracking_code": trackingCode,
		"incident":      report,
	})
}

func TrackPublicIncident(c *gin.Context) {
	code := c.Param("code")
	var report model.IncidentReport
	err := database.DB.Where("tracking_code = ?", code).First(&report).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Report with this tracking code was not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tracking_code": report.TrackingCode,
		"category":      report.Category,
		"status":        report.Status,
		"urgency":       report.Urgency,
		"created_at":    report.CreatedAt,
	})
}

func GetIncidents(c *gin.Context) {
	var incidents []model.IncidentReport
	database.DB.Preload("TargetStudent").
		Preload("Reporter").
		Preload("AssignedCounselor").
		Order("created_at desc").
		Find(&incidents)
	c.JSON(http.StatusOK, incidents)
}

type UpdateIncidentStatusRequest struct {
	Status              string `json:"status" binding:"required"` // UNVERIFIED, INVESTIGATING, SUBSTANTIATED, UNSUBSTANTIATED, CLOSED
	AssignedCounselorID *uint  `json:"assigned_counselor_id"`
}

func UpdateIncidentStatus(c *gin.Context) {
	idParam := c.Param("id")
	iid, _ := strconv.ParseUint(idParam, 10, 32)

	var req UpdateIncidentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status is required"})
		return
	}

	var inc model.IncidentReport
	if err := database.DB.First(&inc, uint(iid)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Incident not found"})
		return
	}

	inc.Status = req.Status
	if req.AssignedCounselorID != nil {
		inc.AssignedCounselorID = req.AssignedCounselorID
	}
	database.DB.Save(&inc)

	// Re-evaluate risk for target student if report is substantiated
	if inc.TargetStudentID != nil {
		go func() {
			service.EvaluateStudentRisk(database.DB, *inc.TargetStudentID)
		}()
	}

	middleware.LogAuditAction(c, "UPDATE_INCIDENT_STATUS", "IncidentReport", &inc.ID, fmt.Sprintf("Status set to %s", req.Status))
	c.JSON(http.StatusOK, inc)
}

// -------------------------------------------------------------
// Early Warning Dashboard & Monitoring Handlers
// -------------------------------------------------------------

func GetDashboardStats(c *gin.Context) {
	var totalStudents int64
	database.DB.Model(&model.User{}).Where("role = ?", model.RoleStudent).Count(&totalStudents)

	var criticalCount int64
	database.DB.Model(&model.RiskEvaluation{}).Where("risk_level = ?", "HIGH_CRITICAL").Count(&criticalCount)

	var watchlistCount int64
	database.DB.Model(&model.RiskEvaluation{}).Where("risk_level = ?", "MODERATE").Count(&watchlistCount)

	var unverifiedReports int64
	database.DB.Model(&model.IncidentReport{}).Where("status = ?", "UNVERIFIED").Count(&unverifiedReports)

	var openVentThreads int64
	database.DB.Model(&model.VentThread{}).Where("status = ?", "OPEN").Count(&openVentThreads)

	c.JSON(http.StatusOK, gin.H{
		"total_students":     totalStudents,
		"critical_count":     criticalCount,
		"watchlist_count":    watchlistCount,
		"unverified_reports": unverifiedReports,
		"open_vent_threads":  openVentThreads,
	})
}

func GetRiskMatrix(c *gin.Context) {
	var evaluations []model.RiskEvaluation
	database.DB.Preload("Student.StudentProfile.Class").
		Order("total_score desc").
		Find(&evaluations)
	c.JSON(http.StatusOK, evaluations)
}

func GetStudentBehavioralProfile(c *gin.Context) {
	idParam := c.Param("id")
	sid, _ := strconv.ParseUint(idParam, 10, 32)

	var student model.User
	if err := database.DB.Preload("StudentProfile.Class").
		Preload("StudentProfile.AssignedCounselor").
		First(&student, uint(sid)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	var eval model.RiskEvaluation
	database.DB.Where("student_id = ?", uint(sid)).First(&eval)

	var moods []model.DailyMood
	database.DB.Where("student_id = ?", uint(sid)).Order("check_date desc").Limit(30).Find(&moods)

	var attendance []model.AttendanceLog
	database.DB.Where("student_id = ?", uint(sid)).Order("recorded_date desc").Limit(30).Find(&attendance)

	var observations []model.BehavioralObservation
	database.DB.Preload("Observer").Where("student_id = ?", uint(sid)).Order("observation_date desc").Find(&observations)

	var incidents []model.IncidentReport
	database.DB.Where("target_student_id = ?", uint(sid)).Order("incident_date desc").Find(&incidents)

	var cases []model.CounselingCase
	database.DB.Preload("Counselor").Where("student_id = ?", uint(sid)).Order("created_at desc").Find(&cases)

	middleware.LogAuditAction(c, "VIEW_STUDENT_RECORD", "StudentProfile", &student.ID, fmt.Sprintf("Viewed 360 profile of student %s %s", student.FirstName, student.LastName))

	c.JSON(http.StatusOK, gin.H{
		"student":      student,
		"risk":         eval,
		"moods":        moods,
		"attendance":   attendance,
		"observations": observations,
		"incidents":    incidents,
		"cases":        cases,
	})
}

// -------------------------------------------------------------
// Counseling Case Records Handlers
// -------------------------------------------------------------

func GetCases(c *gin.Context) {
	var cases []model.CounselingCase
	database.DB.Preload("Student").Preload("Counselor").Order("updated_at desc").Find(&cases)
	c.JSON(http.StatusOK, cases)
}

type CreateCaseRequest struct {
	StudentID         uint   `json:"student_id" binding:"required"`
	CaseTitle         string `json:"case_title" binding:"required"`
	Stage             string `json:"stage"` // INTAKE, ACTIVE_COUNSELING, SWC_REFERRED, MONITORING, CLOSED
	ConfidentialNotes string `json:"confidential_notes" binding:"required"`
	ParentNotified    bool   `json:"parent_notified"`
	SWCRecommendation string `json:"swc_recommendation"`
	PrincipalAction   string `json:"principal_action"`
}

func CreateCase(c *gin.Context) {
	counselorID := c.MustGet("userID").(uint)
	var req CreateCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid case details required"})
		return
	}

	stage := req.Stage
	if stage == "" {
		stage = "INTAKE"
	}

	newCase := model.CounselingCase{
		StudentID:         req.StudentID,
		CounselorID:       counselorID,
		CaseTitle:         req.CaseTitle,
		Stage:             stage,
		ConfidentialNotes: req.ConfidentialNotes,
		ParentNotified:    req.ParentNotified,
		SWCRecommendation: req.SWCRecommendation,
		PrincipalAction:   req.PrincipalAction,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	database.DB.Create(&newCase)
	middleware.LogAuditAction(c, "CREATE_CASE", "CounselingCase", &newCase.ID, fmt.Sprintf("Case created: %s", req.CaseTitle))
	c.JSON(http.StatusCreated, newCase)
}

func UpdateCase(c *gin.Context) {
	idParam := c.Param("id")
	cid, _ := strconv.ParseUint(idParam, 10, 32)

	var req CreateCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid case update data required"})
		return
	}

	var existingCase model.CounselingCase
	if err := database.DB.First(&existingCase, uint(cid)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
		return
	}

	existingCase.CaseTitle = req.CaseTitle
	existingCase.Stage = req.Stage
	existingCase.ConfidentialNotes = req.ConfidentialNotes
	existingCase.ParentNotified = req.ParentNotified
	existingCase.SWCRecommendation = req.SWCRecommendation
	existingCase.PrincipalAction = req.PrincipalAction
	existingCase.UpdatedAt = time.Now()

	database.DB.Save(&existingCase)
	middleware.LogAuditAction(c, "UPDATE_CASE", "CounselingCase", &existingCase.ID, fmt.Sprintf("Case updated: %s", req.CaseTitle))
	c.JSON(http.StatusOK, existingCase)
}

// -------------------------------------------------------------
// Report Generation & Export Handlers
// -------------------------------------------------------------

func ExportCSV(c *gin.Context) {
	c.Header("Content-Disposition", "attachment; filename=campus_sentinel_risk_report.csv")
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{
		"Student ID", "Full Name", "Risk Level", "Risk Score", "Triggers Summary", "Last Evaluated",
	})

	var evaluations []model.RiskEvaluation
	database.DB.Preload("Student.StudentProfile").Find(&evaluations)

	for _, e := range evaluations {
		studentNum := ""
		studentName := "Unknown"
		if e.Student != nil {
			studentName = fmt.Sprintf("%s %s", e.Student.FirstName, e.Student.LastName)
			if e.Student.StudentProfile != nil {
				studentNum = e.Student.StudentProfile.StudentIDNumber
			}
		}

		writer.Write([]string{
			studentNum,
			studentName,
			e.RiskLevel,
			strconv.Itoa(e.TotalScore),
			e.BreakdownJSON,
			e.LastEvaluatedAt.Format(time.RFC3339),
		})
	}

	middleware.LogAuditAction(c, "EXPORT_REPORT", "RiskEvaluation", nil, "Exported full behavioral risk report CSV")
}

// -------------------------------------------------------------
// User Management & Audit Trail Handlers
// -------------------------------------------------------------

func GetUsers(c *gin.Context) {
	var users []model.User
	database.DB.Preload("StudentProfile.Class").Order("id asc").Find(&users)
	c.JSON(http.StatusOK, users)
}

type UpdateUserRoleRequest struct {
	Role model.Role `json:"role" binding:"required"`
}

func UpdateUserRole(c *gin.Context) {
	idParam := c.Param("id")
	uid, _ := strconv.ParseUint(idParam, 10, 32)

	var req UpdateUserRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid role required"})
		return
	}

	var user model.User
	if err := database.DB.First(&user, uint(uid)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	oldRole := user.Role
	user.Role = req.Role
	database.DB.Save(&user)

	middleware.LogAuditAction(c, "MODIFY_USER", "User", &user.ID, fmt.Sprintf("Changed role from %s to %s", oldRole, req.Role))
	c.JSON(http.StatusOK, user)
}

func GetAuditLogs(c *gin.Context) {
	var logs []model.AuditLog
	database.DB.Order("created_at desc").Limit(100).Find(&logs)
	c.JSON(http.StatusOK, logs)
}
