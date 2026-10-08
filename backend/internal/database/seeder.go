package database

import (
	"encoding/json"
	"log"
	"time"

	"campus-sentinel/backend/internal/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedSyntheticData seeds rich realistic demo data for presentations.
func SeedSyntheticData(db *gorm.DB) {
	var userCount int64
	db.Model(&model.User{}).Count(&userCount)
	if userCount > 0 {
		log.Println("[Seeder] Database already populated. Skipping synthetic data seeding.")
		return
	}

	log.Println("[Seeder] Populating rich synthetic academic dataset for Grades 7-12...")

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Password123!"), bcrypt.DefaultCost)
	adminHashed, _ := bcrypt.GenerateFromPassword([]byte("AdminPassword123!"), bcrypt.DefaultCost)

	// 1. Staff and Counselors
	admin := model.User{
		Email:        "admin@sentinel.edu",
		PasswordHash: string(adminHashed),
		Role:         model.RoleSuperAdmin,
		FirstName:    "System",
		LastName:     "Administrator",
		AvatarURL:    "https://api.dicebear.com/7.x/bottts/svg?seed=Admin",
	}
	counselor1 := model.User{
		Email:        "counselor.santos@sentinel.edu",
		PasswordHash: string(hashedPassword),
		Role:         model.RoleCounselor,
		FirstName:    "Maria",
		LastName:     "Santos",
		AvatarURL:    "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
	}
	counselor2 := model.User{
		Email:        "counselor.reyes@sentinel.edu",
		PasswordHash: string(hashedPassword),
		Role:         model.RoleCounselor,
		FirstName:    "Gabriel",
		LastName:     "Reyes",
		AvatarURL:    "https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriel",
	}
	teacher1 := model.User{
		Email:        "adviser.cruz@sentinel.edu",
		PasswordHash: string(hashedPassword),
		Role:         model.RoleTeacher,
		FirstName:    "Elena",
		LastName:     "Cruz",
		AvatarURL:    "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
	}
	teacher2 := model.User{
		Email:        "adviser.delrosario@sentinel.edu",
		PasswordHash: string(hashedPassword),
		Role:         model.RoleTeacher,
		FirstName:    "Mark",
		LastName:     "Del Rosario",
		AvatarURL:    "https://api.dicebear.com/7.x/avataaars/svg?seed=Mark",
	}

	db.Create(&admin)
	db.Create(&counselor1)
	db.Create(&counselor2)
	db.Create(&teacher1)
	db.Create(&teacher2)

	// 2. Classes
	classG9 := model.Class{
		GradeLevel:  9,
		SectionName: "Diamond",
		SchoolYear:  "2026-2027",
		AdviserID:   &teacher1.ID,
	}
	classG10 := model.Class{
		GradeLevel:  10,
		SectionName: "Ruby",
		SchoolYear:  "2026-2027",
		AdviserID:   &teacher2.ID,
	}
	classG7 := model.Class{
		GradeLevel:  7,
		SectionName: "Sapphire",
		SchoolYear:  "2026-2027",
	}
	classG11 := model.Class{
		GradeLevel:  11,
		SectionName: "STEM A",
		SchoolYear:  "2026-2027",
	}
	db.Create(&classG9)
	db.Create(&classG10)
	db.Create(&classG7)
	db.Create(&classG11)

	// 3. Students
	// Student 1: High Risk Story (Juan Dela Cruz)
	studentJuan := model.User{
		Email:        "student.juan@sentinel.edu",
		PasswordHash: string(hashedPassword),
		Role:         model.RoleStudent,
		FirstName:    "Juan",
		LastName:     "Dela Cruz",
		AvatarURL:    "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan",
	}
	// Student 2: Moderate Risk / Mood Decline Story (Miguel Bautista)
	studentMiguel := model.User{
		Email:        "student.miguel@sentinel.edu",
		PasswordHash: string(hashedPassword),
		Role:         model.RoleStudent,
		FirstName:    "Miguel",
		LastName:     "Bautista",
		AvatarURL:    "https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel",
	}
	// Student 3: Low Risk / Positive Story (Althea Mendoza)
	studentAlthea := model.User{
		Email:        "student.althea@sentinel.edu",
		PasswordHash: string(hashedPassword),
		Role:         model.RoleStudent,
		FirstName:    "Althea",
		LastName:     "Mendoza",
		AvatarURL:    "https://api.dicebear.com/7.x/avataaars/svg?seed=Althea",
	}
	// Student 4: Bea Garcia
	studentBea := model.User{
		Email:        "student.bea@sentinel.edu",
		PasswordHash: string(hashedPassword),
		Role:         model.RoleStudent,
		FirstName:    "Bea",
		LastName:     "Garcia",
		AvatarURL:    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bea",
	}
	// Student 5: Paolo Ramos
	studentPaolo := model.User{
		Email:        "student.paolo@sentinel.edu",
		PasswordHash: string(hashedPassword),
		Role:         model.RoleStudent,
		FirstName:    "Paolo",
		LastName:     "Ramos",
		AvatarURL:    "https://api.dicebear.com/7.x/avataaars/svg?seed=Paolo",
	}

	db.Create(&studentJuan)
	db.Create(&studentMiguel)
	db.Create(&studentAlthea)
	db.Create(&studentBea)
	db.Create(&studentPaolo)

	// Profiles
	db.Create(&model.StudentProfile{
		UserID:              studentJuan.ID,
		StudentIDNumber:     "UPIS-2026-901",
		ClassID:             classG9.ID,
		ParentConsentGiven:  true,
		AssignedCounselorID: &counselor1.ID,
	})
	db.Create(&model.StudentProfile{
		UserID:              studentMiguel.ID,
		StudentIDNumber:     "UPIS-2026-902",
		ClassID:             classG9.ID,
		ParentConsentGiven:  true,
		AssignedCounselorID: &counselor1.ID,
	})
	db.Create(&model.StudentProfile{
		UserID:              studentAlthea.ID,
		StudentIDNumber:     "UPIS-2026-903",
		ClassID:             classG9.ID,
		ParentConsentGiven:  true,
		AssignedCounselorID: &counselor1.ID,
	})
	db.Create(&model.StudentProfile{
		UserID:              studentBea.ID,
		StudentIDNumber:     "UPIS-2026-1001",
		ClassID:             classG10.ID,
		ParentConsentGiven:  true,
		AssignedCounselorID: &counselor2.ID,
	})
	db.Create(&model.StudentProfile{
		UserID:              studentPaolo.ID,
		StudentIDNumber:     "UPIS-2026-1002",
		ClassID:             classG10.ID,
		ParentConsentGiven:  true,
		AssignedCounselorID: &counselor2.ID,
	})

	// 4. Daily Mood Check-Ins for Past 14 Days
	today := time.Now()
	for i := 13; i >= 0; i-- {
		d := today.AddDate(0, 0, -i).Format("2006-01-02")
		
		// Althea: Consistently happy/good (4-5)
		db.Create(&model.DailyMood{
			StudentID: studentAlthea.ID,
			CheckDate: d,
			Score:     4 + (i % 2),
			Note:      "Enjoying group study and science project!",
		})

		// Miguel: Declining mood story (starts 4, drops to 2, 1)
		miguelScore := 4
		miguelNote := "Feeling fine"
		if i < 7 {
			miguelScore = 2
			miguelNote = "Feeling exhausted and unmotivated today"
		}
		if i < 3 {
			miguelScore = 1
			miguelNote = "Hard to focus, very anxious about family situation"
		}
		db.Create(&model.DailyMood{
			StudentID: studentMiguel.ID,
			CheckDate: d,
			Score:     miguelScore,
			Note:      miguelNote,
		})

		// Juan: Irregular, low moods (2, 1, 2)
		juanScore := 2
		if i%3 == 0 {
			juanScore = 1
		}
		db.Create(&model.DailyMood{
			StudentID: studentJuan.ID,
			CheckDate: d,
			Score:     juanScore,
			Note:      "Didn't sleep well",
		})
	}

	// 5. Attendance Records
	// Juan has 4 unexcused absences and cuts
	db.Create(&model.AttendanceLog{
		StudentID:    studentJuan.ID,
		ClassID:      classG9.ID,
		RecordedDate: today.AddDate(0, 0, -1).Format("2006-01-02"),
		Status:       "CUTTING_CLASS",
		Remarks:      "Absent during 3rd and 4th period without leave",
		RecordedByID: teacher1.ID,
	})
	db.Create(&model.AttendanceLog{
		StudentID:    studentJuan.ID,
		ClassID:      classG9.ID,
		RecordedDate: today.AddDate(0, 0, -3).Format("2006-01-02"),
		Status:       "UNEXCUSED_ABSENCE",
		Remarks:      "No excuse letter provided",
		RecordedByID: teacher1.ID,
	})
	db.Create(&model.AttendanceLog{
		StudentID:    studentJuan.ID,
		ClassID:      classG9.ID,
		RecordedDate: today.AddDate(0, 0, -5).Format("2006-01-02"),
		Status:       "UNEXCUSED_ABSENCE",
		Remarks:      "Absent from homeroom",
		RecordedByID: teacher1.ID,
	})

	// 6. Teacher Observations
	db.Create(&model.BehavioralObservation{
		StudentID:       studentJuan.ID,
		ObserverID:      teacher1.ID,
		ObservationDate: today.AddDate(0, 0, -2).Format("2006-01-02"),
		Category:        "AGGRESSION",
		Details:         "Violent desk slamming during recess when asked to submit assignment. Showed intense agitation.",
		Severity:        "URGENT",
	})
	db.Create(&model.BehavioralObservation{
		StudentID:       studentMiguel.ID,
		ObserverID:      teacher1.ID,
		ObservationDate: today.AddDate(0, 0, -4).Format("2006-01-02"),
		Category:        "SOCIAL_WITHDRAWAL",
		Details:         "Miguel has stopped participating in class discussions and sits isolated near the back row.",
		Severity:        "MODERATE",
	})

	// 7. Incident Reports
	db.Create(&model.IncidentReport{
		TrackingCode:        "CS-2026-9041",
		ReporterType:        "STUDENT",
		ReporterID:          &studentAlthea.ID,
		TargetStudentID:     &studentJuan.ID,
		IncidentDate:        today.AddDate(0, 0, -2),
		Location:            "Building B, 2nd Floor Restroom",
		Category:            "WEAPON_THREAT",
		Urgency:             "CRITICAL_IMMEDIATE",
		Narrative:           "Heard Juan whispering with an older peer about bringing a knife to campus after a fight outside.",
		Status:              "INVESTIGATING",
		AssignedCounselorID: &counselor1.ID,
	})
	db.Create(&model.IncidentReport{
		TrackingCode:        "CS-2026-8812",
		ReporterType:        "BYSTANDER_ANONYMOUS",
		TargetStudentID:     &studentPaolo.ID,
		IncidentDate:        today.AddDate(0, 0, -6),
		Location:            "School Cafeteria",
		Category:            "BULLYING",
		Urgency:             "ELEVATED",
		Narrative:           "Student was observed cornering Grade 7 students and demanding lunch money repeatedly.",
		Status:              "SUBSTANTIATED",
		AssignedCounselorID: &counselor2.ID,
	})

	// 8. Kudos Wall Posts
	db.Create(&model.KudosPost{
		SenderID:      studentAlthea.ID,
		RecipientName: "Grade 9 Diamond",
		Message:       "Big shoutout to everyone who contributed to our Science Fair exhibit! We did an amazing job together!",
		Category:      "TEAMWORK",
		CreatedAt:     today.AddDate(0, 0, -1),
	})
	db.Create(&model.KudosPost{
		SenderID:      teacher1.ID,
		RecipientName: "All Students",
		Message:       "So proud of the empathy and mutual respect shown during this week's homeroom session. Keep shining!",
		Category:      "ENCOURAGEMENT",
		CreatedAt:     today.AddDate(0, 0, -2),
	})
	db.Create(&model.KudosPost{
		SenderID:      studentMiguel.ID,
		RecipientName: "Ma'am Cruz",
		Message:       "Thank you Ma'am Cruz for your patience and for checking in on us today. It means a lot.",
		Category:      "APPRECIATION",
		CreatedAt:     today.AddDate(0, 0, -3),
	})

	// 9. Vent Space Thread & Messages (Miguel with Counselor Santos)
	threadMiguel := model.VentThread{
		StudentID:         studentMiguel.ID,
		CounselorID:       counselor1.ID,
		ComfortPreference: "INSPIRATIONAL_QUOTE",
		Status:            "COUNSELOR_REPLIED",
	}
	db.Create(&threadMiguel)

	db.Create(&model.VentMessage{
		ThreadID:  threadMiguel.ID,
		SenderID:  studentMiguel.ID,
		Message:   "Ma'am Santos, I'm finding it really hard to keep up with school lately. Everything feels overwhelming at home and I feel like I'm letting everyone down.",
		CreatedAt: today.AddDate(0, 0, -3),
	})
	db.Create(&model.VentMessage{
		ThreadID:  threadMiguel.ID,
		SenderID:  counselor1.ID,
		Message:   "Hello Miguel. Thank you so much for reaching out to me here. It takes real courage to share how you feel. You are not alone, and we can work through this step by step. Would you be comfortable stopping by the Guidance Office tomorrow during recess for a light chat?",
		CreatedAt: today.AddDate(0, 0, -2),
	})

	// 10. Daily Widget (Verse / Word of the Day)
	db.Create(&model.DailyWidget{
		DisplayDate:       today.Format("2006-01-02"),
		QuoteText:         "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
		SourceAttribution: "Philippians 4:6-7",
		Category:          "BIBLE_VERSE",
	})
	db.Create(&model.DailyWidget{
		DisplayDate:       today.AddDate(0, 0, -1).Format("2006-01-02"),
		QuoteText:         "Courage doesn't always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'",
		SourceAttribution: "Mary Anne Radmacher",
		Category:          "INSPIRATIONAL",
	})

	// 11. Counseling Case (Juan Dela Cruz)
	db.Create(&model.CounselingCase{
		StudentID:         studentJuan.ID,
		CounselorID:       counselor1.ID,
		CaseTitle:         "High Risk Escalation: Aggression & Threat Report",
		Stage:             "SWC_REFERRED",
		ConfidentialNotes: "Student attended initial intake. Notified homeroom adviser and scheduled parent conference for Friday. Case referred to Student Welfare Committee (SWC) regarding weapon threat investigation.",
		ParentNotified:    true,
		SWCRecommendation: "Emergency intake with parent guardian, suspension of campus access pending behavioral clearance.",
		PrincipalAction:   "Approved counseling intake protocol and parent conference scheduled.",
	})

	// 12. Pre-calculated Risk Evaluations
	juanBreakdown, _ := json.Marshal(map[string]interface{}{
		"attendance_score":  30,
		"incident_score":    60,
		"observation_score": 25,
		"mood_score":        10,
		"critical_trigger":  true,
		"triggers": []string{
			"Reported weapon sighting or firearm threat",
			"Urgent teacher observation: AGGRESSION",
			"3+ unexcused absences and cutting classes",
		},
	})
	db.Create(&model.RiskEvaluation{
		StudentID:       studentJuan.ID,
		RiskLevel:       "HIGH_CRITICAL",
		TotalScore:      85,
		BreakdownJSON:   string(juanBreakdown),
		LastEvaluatedAt: today,
	})

	miguelBreakdown, _ := json.Marshal(map[string]interface{}{
		"attendance_score":  0,
		"incident_score":    0,
		"observation_score": 15,
		"mood_score":        15,
		"critical_trigger":  false,
		"triggers": []string{
			"Sustained distress / consecutive low mood scores (1-2) over 7 days",
			"Moderate observation: SOCIAL_WITHDRAWAL",
		},
	})
	db.Create(&model.RiskEvaluation{
		StudentID:       studentMiguel.ID,
		RiskLevel:       "MODERATE",
		TotalScore:      45,
		BreakdownJSON:   string(miguelBreakdown),
		LastEvaluatedAt: today,
	})

	altheaBreakdown, _ := json.Marshal(map[string]interface{}{
		"attendance_score":  0,
		"incident_score":    0,
		"observation_score": 0,
		"mood_score":        0,
		"critical_trigger":  false,
		"triggers":          []string{"Normal baseline behavior"},
	})
	db.Create(&model.RiskEvaluation{
		StudentID:       studentAlthea.ID,
		RiskLevel:       "LOW",
		TotalScore:      0,
		BreakdownJSON:   string(altheaBreakdown),
		LastEvaluatedAt: today,
	})

	// 13. Audit Log Entries
	db.Create(&model.AuditLog{
		ActorID:        &counselor1.ID,
		ActorEmail:     counselor1.Email,
		ActorRole:      "COUNSELOR",
		ActionType:     "VIEW_STUDENT_RECORD",
		TargetResource: "StudentProfile",
		TargetID:       &studentJuan.ID,
		IPAddress:      "127.0.0.1",
		UserAgent:      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
		Metadata:       `{"reason": "Triage following weapon threat report CS-2026-9041"}`,
		CreatedAt:      today.AddDate(0, 0, -1),
	})
	db.Create(&model.AuditLog{
		ActorID:        &admin.ID,
		ActorEmail:     admin.Email,
		ActorRole:      "SUPER_ADMIN",
		ActionType:     "LOGIN",
		TargetResource: "Auth",
		IPAddress:      "127.0.0.1",
		UserAgent:      "Mozilla/5.0",
		Metadata:       `{"method": "local_super_admin"}`,
		CreatedAt:      today,
	})

	log.Println("[Seeder] Successfully seeded synthetic dataset for Campus Sentinel!")
}
