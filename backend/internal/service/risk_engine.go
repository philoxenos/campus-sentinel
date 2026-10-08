package service

import (
	"encoding/json"
	"fmt"
	"time"

	"campus-sentinel/backend/internal/model"
	"gorm.io/gorm"
)

type RiskBreakdown struct {
	AttendanceScore int      `json:"attendance_score"`
	IncidentScore   int      `json:"incident_score"`
	ObservationScore int     `json:"observation_score"`
	MoodScore       int      `json:"mood_score"`
	CriticalTrigger bool     `json:"critical_trigger"`
	Triggers        []string `json:"triggers"`
}

// EvaluateStudentRisk calculates the cumulative behavioral risk indicators for a student.
func EvaluateStudentRisk(db *gorm.DB, studentID uint) (*model.RiskEvaluation, error) {
	var student model.User
	if err := db.Preload("StudentProfile").First(&student, studentID).Error; err != nil {
		return nil, err
	}

	breakdown := RiskBreakdown{
		Triggers: []string{},
	}
	totalScore := 0

	// 1. Evaluate Attendance (Unexcused absences & cuts)
	var unexcusedCount int64
	db.Model(&model.AttendanceLog{}).
		Where("student_id = ? AND status IN ('UNEXCUSED_ABSENCE', 'CUTTING_CLASS')", studentID).
		Count(&unexcusedCount)

	if unexcusedCount > 0 {
		attScore := int(unexcusedCount) * 10
		if attScore > 30 {
			attScore = 30
		}
		breakdown.AttendanceScore = attScore
		totalScore += attScore
		breakdown.Triggers = append(breakdown.Triggers, fmt.Sprintf("%d unexcused absences/cuts recorded", unexcusedCount))
	}

	// 2. Evaluate Teacher Observations
	var observations []model.BehavioralObservation
	db.Where("student_id = ?", studentID).Find(&observations)
	obsScore := 0
	for _, obs := range observations {
		switch obs.Severity {
		case "URGENT":
			obsScore += 25
			breakdown.Triggers = append(breakdown.Triggers, fmt.Sprintf("Urgent teacher observation: %s", obs.Category))
		case "MODERATE":
			obsScore += 15
			breakdown.Triggers = append(breakdown.Triggers, fmt.Sprintf("Moderate observation: %s", obs.Category))
		case "MILD":
			obsScore += 5
		}
	}
	if obsScore > 40 {
		obsScore = 40
	}
	breakdown.ObservationScore = obsScore
	totalScore += obsScore

	// 3. Evaluate Incident Reports (Target student, substantiated/investigating)
	var incidents []model.IncidentReport
	db.Where("target_student_id = ? AND status IN ('INVESTIGATING', 'SUBSTANTIATED')", studentID).Find(&incidents)
	incScore := 0
	hasCriticalIncident := false
	for _, inc := range incidents {
		switch inc.Category {
		case "WEAPON_THREAT":
			incScore += 60
			hasCriticalIncident = true
			breakdown.Triggers = append(breakdown.Triggers, "Reported weapon sighting or firearm threat")
		case "PHYSICAL_VIOLENCE":
			incScore += 45
			hasCriticalIncident = true
			breakdown.Triggers = append(breakdown.Triggers, "Reported physical assault or violent fight")
		case "SELF_HARM":
			incScore += 40
			breakdown.Triggers = append(breakdown.Triggers, "Self-harm or severe crisis alert")
		case "BULLYING":
			incScore += 30
			breakdown.Triggers = append(breakdown.Triggers, "Substantiated peer bullying report")
		default:
			incScore += 15
		}
	}
	breakdown.IncidentScore = incScore
	breakdown.CriticalTrigger = hasCriticalIncident
	totalScore += incScore

	// 4. Evaluate Mood Check-in Patterns (Recent 5 entries)
	var moods []model.DailyMood
	db.Where("student_id = ?", studentID).Order("check_date desc").Limit(5).Find(&moods)
	if len(moods) >= 3 {
		lowCount := 0
		for _, m := range moods {
			if m.Score <= 2 {
				lowCount++
			}
		}
		if lowCount >= 3 {
			breakdown.MoodScore = 15
			totalScore += 15
			breakdown.Triggers = append(breakdown.Triggers, "Sustained distress / consecutive low mood scores")
		}
	}

	// Determine Tier
	riskLevel := "LOW"
	if hasCriticalIncident || totalScore >= 65 {
		riskLevel = "HIGH_CRITICAL"
	} else if totalScore >= 30 {
		riskLevel = "MODERATE"
	}

	breakdownBytes, _ := json.Marshal(breakdown)

	var eval model.RiskEvaluation
	err := db.Where("student_id = ?", studentID).First(&eval).Error
	if err != nil {
		eval = model.RiskEvaluation{
			StudentID:       studentID,
			RiskLevel:       riskLevel,
			TotalScore:      totalScore,
			BreakdownJSON:   string(breakdownBytes),
			LastEvaluatedAt: time.Now(),
		}
		db.Create(&eval)
	} else {
		oldLevel := eval.RiskLevel
		eval.RiskLevel = riskLevel
		eval.TotalScore = totalScore
		eval.BreakdownJSON = string(breakdownBytes)
		eval.LastEvaluatedAt = time.Now()
		db.Save(&eval)

		// Alert trigger if transitioning into HIGH_CRITICAL
		if riskLevel == "HIGH_CRITICAL" && oldLevel != "HIGH_CRITICAL" {
			var counselors []model.User
			db.Where("role = ?", model.RoleCounselor).Find(&counselors)
			var emails []string
			for _, c := range counselors {
				emails = append(emails, c.Email)
			}
			studentFullName := fmt.Sprintf("%s %s", student.FirstName, student.LastName)
			studentIDNum := ""
			if student.StudentProfile != nil {
				studentIDNum = student.StudentProfile.StudentIDNumber
			}
			triggerSummary := fmt.Sprintf("Risk Score: %d. Triggers: %v", totalScore, breakdown.Triggers)
			NotifyAssignedStaffOnCriticalRisk(studentFullName, studentIDNum, triggerSummary, emails)
		}
	}

	return &eval, nil
}
