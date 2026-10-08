# Campus Sentinel
**School Behavioral Monitoring and Early Warning System**  
*MSIT 632 Group 10 | Target Client: UPIS Guidance Office (Grades 7–12)*

---

## 🚀 Live Working Prototype

The prototype is currently built, configured, and running:
* **Frontend:** [http://localhost:3000](http://localhost:3000) (React 19 + TypeScript + Tailwind CSS + Vite)
* **Backend API:** [http://localhost:8080](http://localhost:8080) (Go + Gin Engine + GORM)
* **Database:** MySQL compatible (with zero-friction fallback embedded SQLite and automated migrations)

---

## 🔑 Pre-Seeded Synthetic Personas & Demo Accounts

For client presentations and grading demonstrations, 1-click quick persona switching is provided in the top navigation bar. You can also sign in manually using the following credentials:

| Persona | Role | Email | Password | Narrative / Demonstration Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `SUPER_ADMIN` | `admin@sentinel.edu` | `AdminPassword123!` | RBAC User Directory management & RA 10173 Audit Trail |
| **Maria Santos** | `COUNSELOR` | `counselor.santos@sentinel.edu` | `Password123!` | Early Warning Dashboard, Risk Matrix, Incident Triage & Case Records |
| **Elena Cruz** | `TEACHER` | `adviser.cruz@sentinel.edu` | `Password123!` | Grade 9 Diamond Roster, Daily Attendance & Significant Observations |
| **Juan Dela Cruz** | `STUDENT` | `student.juan@sentinel.edu` | `Password123!` | 🔴 **High/Critical Risk Story** (weapon threat, aggression note, 4 unexcused cuts) |
| **Miguel Bautista** | `STUDENT` | `student.miguel@sentinel.edu` | `Password123!` | 🟡 **Watchlist Story** (7-day declining mood, active Vent Space conversation) |
| **Althea Mendoza** | `STUDENT` | `student.althea@sentinel.edu` | `Password123!` | 🟢 **Baseline Resilient Story** (positive mood history, Kudos sender) |
| **Public / Bystander** | `PUBLIC` | *No login needed* | *No login needed* | Public Concern & Incident Reporting Portal with Tracking Code |

---

## 📦 Implemented Modules

1. **Authentication & Authorization (RBAC)**:
   - Google Sign-In support (accepts any registered Google email in user management).
   - Super Admin local authentication.
   - JWT token issuance and strict role-based route guards.
2. **Kudos Wall (Good Vibes Only)**:
   - Positive peer recognition board.
   - Real-time dual-language (English + Tagalog) harmful/offensive word filter.
   - Blocks negative submissions with toast: *"Harmful words detected. The Kudos Wall is reserved for uplifting messages only."*
3. **Daily Mood Check-In (Clickable Calendar)**:
   - Month-view calendar displaying emoji mood entries (1 to 5 scale).
   - Click past dates to view reflection notes; log today's mood with 1 click.
4. **Vent Space & Comfort Messages**:
   - Confidential 1-on-1 messaging channel strictly between student and assigned counselor.
   - Comfort Message mode selector: Scripture Verses, Inspirational Quotes, Mindfulness Grounding.
5. **Daily Inspiration Widget**:
   - Verse / Word of the day card for campus wellness.
6. **Class List & Attendance Log**:
   - Teacher attendance logger (Present, Tardy, Excused, Unexcused Absence, Cutting Class).
   - Automatically feeds the truancy indicator.
7. **Significant Behavioral Observations**:
   - Teacher observation logger for significant behavioral changes (Social Withdrawal, Aggression, etc.).
8. **Public Concern & Incident Reporting**:
   - Publicly accessible without login.
   - Emergency hotline disclaimer banner.
   - Generates unique tracking code (e.g. `CS-2026-XXXX`) for reporter status lookup.
9. **Early Warning Risk Engine & Monitoring Dashboard**:
   - Multi-factor risk calculation combining substantiated incidents, truancy spikes, teacher observations, and mood drops.
   - Tiered badges: 🟢 Low / Normal, 🟡 Watchlist, 🔴 High / Critical.
   - 360° student behavioral drilldown modal.
10. **Counselor Case Records & SWC Referrals**:
    - Official counseling case files, SWC referral recommendations, principal actions.
11. **Automated Email Dispatcher**:
    - Fires automated alert notifications to counselors when critical risk or weapon threats are detected.
12. **Report Generation**:
    - 1-click export of student behavioral risk data to CSV.
13. **Data Privacy Audit Trail (RA 10173)**:
    - Immutable audit logs tracking who viewed confidential student files, timestamps, and IP addresses.

---

## 🛠️ How to Run Locally

### Backend (Go)
```powershell
cd backend
go run cmd/api/main.go
# Runs on http://localhost:8080
```
*Note: To connect to an external MySQL server, set `MYSQL_DSN="user:password@tcp(127.0.0.1:3306)/campus_sentinel?charset=utf8mb4&parseTime=True&loc=Local"`. If omitted or unreachable, it seamlessly operates on local SQLite.*

### Frontend (React)
```powershell
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```
