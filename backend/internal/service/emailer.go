package service

import (
	"fmt"
	"log"
	"time"
)

type EmailAlert struct {
	RecipientEmail string
	RecipientRole  string
	Subject        string
	StudentName    string
	StudentID      string
	RiskLevel      string
	Reason         string
	Timestamp      time.Time
}

// SendCriticalAlert logs and dispatches an automated alert email.
// In production, this can bind to an SMTP server or SendGrid/SES.
func SendCriticalAlert(alert EmailAlert) {
	go func() {
		log.Printf(`
=============================================================
[CAMPUS SENTINEL EMAIL NOTIFICATION DISPATCH]
Time: %s
To: %s (%s)
Subject: %s
Alert: CRITICAL BEHAVIORAL INDICATOR DETECTED
Student: %s (ID: %s)
Risk Status: %s
Reason: %s
Instruction: Immediate Guidance / Student Welfare Committee triage recommended.
=============================================================
`, alert.Timestamp.Format(time.RFC1123), alert.RecipientEmail, alert.RecipientRole, alert.Subject, alert.StudentName, alert.StudentID, alert.RiskLevel, alert.Reason)
	}()
}

func NotifyAssignedStaffOnCriticalRisk(studentName, studentID, reason string, counselorEmails []string) {
	for _, email := range counselorEmails {
		SendCriticalAlert(EmailAlert{
			RecipientEmail: email,
			RecipientRole:  "Guidance Counselor / SWC",
			Subject:        fmt.Sprintf("URGENT: High Risk Early Warning Flag - %s", studentName),
			StudentName:    studentName,
			StudentID:      studentID,
			RiskLevel:      "HIGH_CRITICAL",
			Reason:         reason,
			Timestamp:      time.Now(),
		})
	}
}
