package model

import (
	"time"
)

type Role string

const (
	RoleStudent     Role = "STUDENT"
	RoleTeacher     Role = "TEACHER"
	RoleCounselor   Role = "COUNSELOR"
	RoleGLC         Role = "GLC"
	RoleSuperAdmin  Role = "SUPER_ADMIN"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	GoogleID     string    `gorm:"size:255;index" json:"google_id,omitempty"`
	Email        string    `gorm:"size:191;uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"size:255" json:"-"`
	Role         Role      `gorm:"size:50;not null;default:'STUDENT'" json:"role"`
	FirstName    string    `gorm:"size:100;not null" json:"first_name"`
	LastName     string    `gorm:"size:100;not null" json:"last_name"`
	AvatarURL    string    `gorm:"size:500" json:"avatar_url"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	StudentProfile *StudentProfile `gorm:"foreignKey:UserID" json:"student_profile,omitempty"`
}

type Class struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	GradeLevel  int       `gorm:"not null" json:"grade_level"`
	SectionName string    `gorm:"size:100;not null" json:"section_name"`
	SchoolYear  string    `gorm:"size:50;not null" json:"school_year"`
	AdviserID   *uint     `json:"adviser_id"`
	Adviser     *User     `gorm:"foreignKey:AdviserID" json:"adviser,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type StudentProfile struct {
	ID                  uint   `gorm:"primaryKey" json:"id"`
	UserID              uint   `gorm:"uniqueIndex;not null" json:"user_id"`
	User                *User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	StudentIDNumber     string `gorm:"size:50;uniqueIndex;not null" json:"student_id_number"`
	ClassID             uint   `gorm:"not null" json:"class_id"`
	Class               *Class `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	ParentConsentGiven  bool   `gorm:"default:false" json:"parent_consent_given"`
	AssignedCounselorID *uint  `json:"assigned_counselor_id"`
	AssignedCounselor   *User  `gorm:"foreignKey:AssignedCounselorID" json:"assigned_counselor,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
}

type KudosPost struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	SenderID      uint      `gorm:"not null" json:"sender_id"`
	Sender        *User     `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	RecipientName string    `gorm:"size:150" json:"recipient_name"`
	Message       string    `gorm:"type:text;not null" json:"message"`
	Category      string    `gorm:"size:50;default:'APPRECIATION'" json:"category"`
	CreatedAt     time.Time `json:"created_at"`
}

type VentThread struct {
	ID                uint          `gorm:"primaryKey" json:"id"`
	StudentID         uint          `gorm:"not null" json:"student_id"`
	Student           *User         `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	CounselorID       uint          `gorm:"not null" json:"counselor_id"`
	Counselor         *User         `gorm:"foreignKey:CounselorID" json:"counselor,omitempty"`
	ComfortPreference string        `gorm:"size:50;default:'INSPIRATIONAL_QUOTE'" json:"comfort_preference"`
	Status            string        `gorm:"size:50;default:'OPEN'" json:"status"` // OPEN, COUNSELOR_REPLIED, RESOLVED
	CreatedAt         time.Time     `json:"created_at"`
	UpdatedAt         time.Time     `json:"updated_at"`
	Messages          []VentMessage `gorm:"foreignKey:ThreadID" json:"messages,omitempty"`
}

type VentMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ThreadID  uint      `gorm:"not null" json:"thread_id"`
	SenderID  uint      `gorm:"not null" json:"sender_id"`
	Sender    *User     `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

type DailyMood struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StudentID uint      `gorm:"not null;index:idx_student_date,unique" json:"student_id"`
	CheckDate string    `gorm:"size:20;not null;index:idx_student_date,unique" json:"check_date"` // YYYY-MM-DD
	Score     int       `gorm:"not null" json:"score"` // 1: Very Bad, 2: Bad, 3: Okay, 4: Good, 5: Great
	Note      string    `gorm:"size:255" json:"note"`
	CreatedAt time.Time `json:"created_at"`
}

type DailyWidget struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	DisplayDate        string    `gorm:"size:20;uniqueIndex;not null" json:"display_date"` // YYYY-MM-DD
	QuoteText          string    `gorm:"type:text;not null" json:"quote_text"`
	SourceAttribution  string    `gorm:"size:150" json:"source_attribution"`
	Category           string    `gorm:"size:50;default:'INSPIRATIONAL'" json:"category"` // BIBLE_VERSE, INSPIRATIONAL
	CreatedAt          time.Time `json:"created_at"`
}

type AttendanceLog struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	StudentID    uint      `gorm:"not null;index:idx_student_att,unique" json:"student_id"`
	Student      *User     `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	ClassID      uint      `gorm:"not null" json:"class_id"`
	RecordedDate string    `gorm:"size:20;not null;index:idx_student_att,unique" json:"recorded_date"` // YYYY-MM-DD
	Status       string    `gorm:"size:50;not null" json:"status"` // PRESENT, EXCUSED_ABSENCE, UNEXCUSED_ABSENCE, TARDY, CUTTING_CLASS
	Remarks      string    `gorm:"size:255" json:"remarks"`
	RecordedByID uint      `gorm:"not null" json:"recorded_by_id"`
	RecordedBy   *User     `gorm:"foreignKey:RecordedByID" json:"recorded_by,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type BehavioralObservation struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	StudentID       uint      `gorm:"not null" json:"student_id"`
	Student         *User     `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	ObserverID      uint      `gorm:"not null" json:"observer_id"`
	Observer        *User     `gorm:"foreignKey:ObserverID" json:"observer,omitempty"`
	ObservationDate string    `gorm:"size:20;not null" json:"observation_date"`
	Category        string    `gorm:"size:50;not null" json:"category"` // SOCIAL_WITHDRAWAL, AGGRESSION, ACADEMIC_DROP, DISRUPTIVE, DISTRESS, POSITIVE_GROWTH
	Details         string    `gorm:"type:text;not null" json:"details"`
	Severity        string    `gorm:"size:50;default:'MILD'" json:"severity"` // MILD, MODERATE, URGENT
	CreatedAt       time.Time `json:"created_at"`
}

type IncidentReport struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	TrackingCode        string    `gorm:"size:32;uniqueIndex;not null" json:"tracking_code"`
	ReporterType        string    `gorm:"size:50;not null" json:"reporter_type"` // STUDENT, TEACHER, PARENT, BYSTANDER_ANONYMOUS
	ReporterID          *uint     `json:"reporter_id"`
	Reporter            *User     `gorm:"foreignKey:ReporterID" json:"reporter,omitempty"`
	ReporterContact     string    `gorm:"size:191" json:"reporter_contact"`
	TargetStudentID     *uint     `json:"target_student_id"`
	TargetStudent       *User     `gorm:"foreignKey:TargetStudentID" json:"target_student,omitempty"`
	IncidentDate        time.Time `json:"incident_date"`
	Location            string    `gorm:"size:150;not null" json:"location"`
	Category            string    `gorm:"size:50;not null" json:"category"` // BULLYING, PHYSICAL_VIOLENCE, WEAPON_THREAT, VERBAL_THREAT, SELF_HARM, SUBSTANCE, OTHER
	Urgency             string    `gorm:"size:50;default:'ROUTINE'" json:"urgency"` // ROUTINE, ELEVATED, CRITICAL_IMMEDIATE
	Narrative           string    `gorm:"type:text;not null" json:"narrative"`
	Status              string    `gorm:"size:50;default:'UNVERIFIED'" json:"status"` // UNVERIFIED, INVESTIGATING, SUBSTANTIATED, UNSUBSTANTIATED, CLOSED
	AssignedCounselorID *uint     `json:"assigned_counselor_id"`
	AssignedCounselor   *User     `gorm:"foreignKey:AssignedCounselorID" json:"assigned_counselor,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
}

type RiskEvaluation struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	StudentID        uint      `gorm:"uniqueIndex;not null" json:"student_id"`
	Student          *User     `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	RiskLevel        string    `gorm:"size:50;default:'LOW'" json:"risk_level"` // LOW, MODERATE, HIGH_CRITICAL
	TotalScore       int       `gorm:"default:0" json:"total_score"`
	BreakdownJSON    string    `gorm:"type:text" json:"breakdown_json"`
	LastEvaluatedAt  time.Time `json:"last_evaluated_at"`
}

type CounselingCase struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	StudentID         uint      `gorm:"not null" json:"student_id"`
	Student           *User     `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	CounselorID       uint      `gorm:"not null" json:"counselor_id"`
	Counselor         *User     `gorm:"foreignKey:CounselorID" json:"counselor,omitempty"`
	CaseTitle         string    `gorm:"size:200;not null" json:"case_title"`
	Stage             string    `gorm:"size:50;default:'INTAKE'" json:"stage"` // INTAKE, ACTIVE_COUNSELING, SWC_REFERRED, MONITORING, CLOSED
	ConfidentialNotes string    `gorm:"type:text;not null" json:"confidential_notes"`
	ParentNotified    bool      `gorm:"default:false" json:"parent_notified"`
	SWCRecommendation string    `gorm:"type:text" json:"swc_recommendation"`
	PrincipalAction   string    `gorm:"type:text" json:"principal_action"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type AuditLog struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	ActorID        *uint     `json:"actor_id"`
	ActorEmail     string    `gorm:"size:191;not null" json:"actor_email"`
	ActorRole      string    `gorm:"size:50;not null" json:"actor_role"`
	ActionType     string    `gorm:"size:50;not null" json:"action_type"`
	TargetResource string    `gorm:"size:100;not null" json:"target_resource"`
	TargetID       *uint     `json:"target_id"`
	IPAddress      string    `gorm:"size:45" json:"ip_address"`
	UserAgent      string    `gorm:"size:255" json:"user_agent"`
	Metadata       string    `gorm:"type:text" json:"metadata"`
	CreatedAt      time.Time `json:"created_at"`
}
