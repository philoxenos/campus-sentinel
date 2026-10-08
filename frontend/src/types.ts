export type Role = 'STUDENT' | 'TEACHER' | 'COUNSELOR' | 'GLC' | 'SUPER_ADMIN' | 'PUBLIC';

export interface User {
  id: number;
  email: string;
  role: Role;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  is_active: boolean;
  student_profile?: StudentProfile;
}

export interface Class {
  id: number;
  grade_level: number;
  section_name: string;
  school_year: string;
  adviser_id?: number;
  adviser?: User;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  user?: User;
  student_id_number: string;
  class_id: number;
  class?: Class;
  parent_consent_given: boolean;
  assigned_counselor_id?: number;
  assigned_counselor?: User;
}

export interface KudosPost {
  id: number;
  sender_id: number;
  sender?: User;
  recipient_name: string;
  message: string;
  category: 'APPRECIATION' | 'KINDNESS' | 'TEAMWORK' | 'ENCOURAGEMENT';
  created_at: string;
}

export interface VentMessage {
  id: number;
  thread_id: number;
  sender_id: number;
  sender?: User;
  message: string;
  created_at: string;
}

export interface VentThread {
  id: number;
  student_id: number;
  student?: User;
  counselor_id: number;
  counselor?: User;
  comfort_preference: 'BIBLE_VERSE' | 'INSPIRATIONAL_QUOTE' | 'MINDFULNESS' | 'NONE';
  status: 'OPEN' | 'COUNSELOR_REPLIED' | 'RESOLVED';
  created_at: string;
  updated_at: string;
  messages?: VentMessage[];
}

export interface DailyMood {
  id: number;
  student_id: number;
  check_date: string; // YYYY-MM-DD
  score: number; // 1 to 5
  note?: string;
}

export interface DailyWidget {
  id: number;
  display_date: string;
  quote_text: string;
  source_attribution: string;
  category: string;
}

export interface AttendanceLog {
  id: number;
  student_id: number;
  student?: User;
  class_id: number;
  recorded_date: string;
  status: 'PRESENT' | 'EXCUSED_ABSENCE' | 'UNEXCUSED_ABSENCE' | 'TARDY' | 'CUTTING_CLASS';
  remarks?: string;
  recorded_by?: User;
}

export interface BehavioralObservation {
  id: number;
  student_id: number;
  student?: User;
  observer_id: number;
  observer?: User;
  observation_date: string;
  category: 'SOCIAL_WITHDRAWAL' | 'AGGRESSION' | 'ACADEMIC_DROP' | 'DISRUPTIVE' | 'DISTRESS' | 'POSITIVE_GROWTH';
  details: string;
  severity: 'MILD' | 'MODERATE' | 'URGENT';
  created_at: string;
}

export interface IncidentReport {
  id: number;
  tracking_code: string;
  reporter_type: 'STUDENT' | 'TEACHER' | 'PARENT' | 'BYSTANDER_ANONYMOUS';
  reporter_contact?: string;
  target_student_id?: number;
  target_student?: User;
  incident_date: string;
  location: string;
  category: 'BULLYING' | 'PHYSICAL_VIOLENCE' | 'WEAPON_THREAT' | 'VERBAL_THREAT' | 'SELF_HARM' | 'SUBSTANCE' | 'OTHER';
  urgency: 'ROUTINE' | 'ELEVATED' | 'CRITICAL_IMMEDIATE';
  narrative: string;
  status: 'UNVERIFIED' | 'INVESTIGATING' | 'SUBSTANTIATED' | 'UNSUBSTANTIATED' | 'CLOSED';
  assigned_counselor?: User;
  created_at: string;
}

export interface RiskEvaluation {
  id: number;
  student_id: number;
  student?: User;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH_CRITICAL';
  total_score: number;
  breakdown_json: string;
  last_evaluated_at: string;
}

export interface CounselingCase {
  id: number;
  student_id: number;
  student?: User;
  counselor_id: number;
  counselor?: User;
  case_title: string;
  stage: 'INTAKE' | 'ACTIVE_COUNSELING' | 'SWC_REFERRED' | 'MONITORING' | 'CLOSED';
  confidential_notes: string;
  parent_notified: boolean;
  swc_recommendation?: string;
  principal_action?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  actor_id?: number;
  actor_email: string;
  actor_role: string;
  action_type: string;
  target_resource: string;
  target_id?: number;
  ip_address: string;
  user_agent: string;
  metadata?: string;
  created_at: string;
}
