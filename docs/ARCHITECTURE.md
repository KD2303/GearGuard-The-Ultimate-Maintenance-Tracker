# GearGuard System Architecture

## Application Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (React + TypeScript + Vite)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Dashboard   │  │   Kanban     │  │  Calendar    │        │
│  │   Page       │  │   Board      │  │    View      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │  Equipment   │  │    Teams     │                           │
│  │    List      │  │    Page      │                           │
│  └──────────────┘  └──────────────┘                           │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/REST API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      API LAYER                                  │
│                 (Express.js Router)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /api/equipment      /api/teams       /api/members             │
│  /api/requests       /api/health                               │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                   BUSINESS LOGIC                                │
│                    (Controllers)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Equipment Controller    • Request Controller                │
│  • Team Controller         • Member Controller                 │
│                                                                 │
│  Smart Features:                                                │
│  • Auto-fill logic         • Scrap logic                       │
│  • Request numbering       • Status updates                    │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Mongoose ODM (MongoDB)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    DATABASE LAYER                               │
│                   (MongoDB)                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐               │
│  │    Equipment     │──────│ MaintenanceTeam  │               │
│  │                  │      │                  │               │
│  │ • id            │      │ • id             │               │
│  │ • name          │      │ • name           │               │
│  │ • serialNumber  │      │ • specialization │               │
│  │ • category      │      │ • isActive       │               │
│  │ • location      │      └──────────────────┘               │
│  │ • status        │                │                         │
│  │ • teamId (FK)   │◄───────────────┘                         │
│  │ • techId (FK)   │◄───────────┐                             │
│  └──────────────────┘            │                             │
│         │                        │                             │
│         │                   ┌────▼─────────────┐               │
│         │                   │   TeamMember     │               │
│         │                   │                  │               │
│         │                   │ • id            │               │
│         │                   │ • name          │               │
│         │                   │ • email         │               │
│         │                   │ • role          │               │
│         │                   │ • teamId (FK)   │               │
│         │                   └──────────────────┘               │
│         │                            │                         │
│         │                            │                         │
│   ┌─────▼────────────────────────────▼────┐                   │
│   │     MaintenanceRequest                │                   │
│   │                                        │                   │
│   │ • id                                   │                   │
│   │ • requestNumber                        │                   │
│   │ • subject                              │                   │
│   │ • type (corrective/preventive)        │                   │
│   │ • stage (new/in-progress/repaired)    │                   │
│   │ • priority                             │                   │
│   │ • scheduledDate                        │                   │
│   │ • duration                             │                   │
│   │ • equipmentId (FK)                     │                   │
│   │ • teamId (FK)                          │                   │
│   │ • assignedToId (FK)                    │                   │
│   └────────────────────────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Request Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORRECTIVE MAINTENANCE                        │
│                      (Breakdown Repair)                          │
└─────────────────────────────────────────────────────────────────┘

User Identifies Issue
         │
         ▼
Creates Request ─────► Selects Equipment
         │                     │
         │                     ▼
         │            AUTO-FILL TRIGGERED:
         │            • Team (from equipment)
         │            • Technician (from equipment)
         │            • Equipment Status → "under-maintenance"
         │
         ▼
Request Stage: NEW
         │
         ▼
Manager/Technician Assigns
         │
         ▼
Request Stage: IN PROGRESS
         │
         ▼
Technician Works on Repair
Records Duration
         │
         ▼
Request Stage: REPAIRED
Equipment Status → "active"
         │
         ▼
    COMPLETED


┌─────────────────────────────────────────────────────────────────┐
│                   PREVENTIVE MAINTENANCE                         │
│                     (Routine Checkup)                            │
└─────────────────────────────────────────────────────────────────┘

Manager Plans Maintenance
         │
         ▼
Creates Request (Type: Preventive)
Sets Scheduled Date
         │
         ▼
Appears on Calendar View
         │
         ▼
Scheduled Date Arrives
         │
         ▼
Technician Sees Request
Moves to IN PROGRESS
         │
         ▼
Performs Maintenance
Records Duration
         │
         ▼
Moves to REPAIRED
         │
         ▼
    COMPLETED
```

## Data Relationships

```
MaintenanceTeam (1) ────────> (N) TeamMember
                 │
                 │
                 ▼
         (1) Equipment (N) ────────> (1) MaintenanceRequest (N)
                 │
                 │
                 ▼
            TeamMember (default technician)


Relationships:
• Each Equipment belongs to ONE MaintenanceTeam
• Each Equipment has ONE default TeamMember (technician)
• Each TeamMember belongs to ONE MaintenanceTeam
• Each MaintenanceRequest links to ONE Equipment (optional)
• Each MaintenanceRequest links to ONE MaintenanceTeam
• Each MaintenanceRequest links to ONE TeamMember (assigned technician)
```

## Smart Features Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     AUTO-FILL LOGIC                           │
└──────────────────────────────────────────────────────────────┘

User Creates Request
         │
         ▼
Selects Equipment: "CNC Machine 01"
         │
         ▼
Backend Fetches Equipment Details:
• maintenanceTeamId: "team-uuid-123"
• defaultTechnicianId: "member-uuid-456"
• category: "Machine"
         │
         ▼
Auto-Populates Request Fields:
• teamId ← Equipment.maintenanceTeamId
• assignedToId ← Equipment.defaultTechnicianId
         │
         ▼
Updates Equipment Status:
• status ← "under-maintenance"
         │
         ▼
Request Created with Pre-filled Data


┌──────────────────────────────────────────────────────────────┐
│                      SCRAP LOGIC                              │
└──────────────────────────────────────────────────────────────┘

Technician Assesses Equipment
         │
         ▼
Determines Beyond Repair
         │
         ▼
Moves Request to "SCRAP" Stage
         │
         ▼
Backend Triggers:
• Sets Request.completedDate = NOW
• Updates Equipment.status = "scrapped"
         │
         ▼
Equipment Marked as Scrapped
No Longer Shows in Active Lists


┌──────────────────────────────────────────────────────────────┐
│                   SMART BUTTON (Equipment)                    │
└──────────────────────────────────────────────────────────────┘

User Views Equipment Card
         │
         ▼
Smart Button Shows:
"🔧 Maintenance [2]"  ← Count of open requests
         │
         ▼
User Clicks Button
         │
         ▼
Backend Fetches:
• All MaintenanceRequests WHERE equipmentId = equipment.id
• Filtered by stage != 'repaired' AND stage != 'scrap'
         │
         ▼
Displays Maintenance History Modal
Shows: Request Number, Subject, Stage, Technician, Date
```

## Technology Stack Layers

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER                                          │
│ • React 18 (Component-based UI)                            │
│ • TypeScript (Type safety)                                  │
│ • Tailwind CSS (Styling)                                    │
│ • React Router (Navigation)                                 │
│ • React DnD (Drag & Drop)                                   │
│ • React Big Calendar (Scheduling)                           │
│ • Lucide React (Icons)                                      │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER                                           │
│ • Vite (Build tool)                                         │
│ • Axios (HTTP client)                                       │
│ • Service Layer (API abstraction)                           │
│ • Component Library (Reusable UI)                           │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ API LAYER                                                   │
│ • Express.js (Web framework)                                │
│ • CORS (Cross-origin)                                       │
│ • Body Parser (JSON parsing)                                │
│ • Morgan (Request logging)                                  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC LAYER                                        │
│ • Controllers (Business rules)                              │
│ • Validators (Input validation)                             │
│ • Utilities (Helper functions)                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ DATA ACCESS LAYER                                           │
│ • Mongoose ODM (Database abstraction)                      │
│ • Models (Data structures)                                  │
│ • Relationships (Foreign keys)                              │
│ • Migrations (Schema management)                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE LAYER                                              │
│ • MongoDB (Document database)                                │
│ • Indexes (Performance)                                      │
│ • References via ObjectId for relationships                   │
│ • Transactions (supported on replica sets when needed)       │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
                    ┌─────────────────┐
                    │   Web Browser   │
                    └────────┬────────┘
                             │
                             │ HTTPS
                             │
                    ┌────────▼────────┐
                    │   Load Balancer │  (Optional)
                    │   (Nginx/AWS)   │
                    └────────┬────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼─────────┐              ┌───────────▼──────────┐
│  Frontend Server  │              │  Backend API Server  │
│  (Static Files)   │              │  (Node.js/Express)   │
│  - React Build    │              │  - Port 5000         │
│  - Port 3000      │              │  - REST API          │
└───────────────────┘              └──────────┬───────────┘
                                              │
                                              │
                                   ┌──────────▼──────────┐
                                   │  MongoDB DB         │
                                   │  - Port 27017       │
                                   │  - Data Storage     │
                                   └─────────────────────┘
```

## File Structure Tree

```
gearguard/
│
├── server/                          # Backend Application
│   ├── config/
│   │   └── database.js             # DB connection config
│   ├── models/
│   │   ├── Equipment.js            # Equipment model
│   │   ├── MaintenanceTeam.js      # Team model
│   │   ├── TeamMember.js           # Member model
│   │   ├── MaintenanceRequest.js   # Request model
│   │   └── index.js                # Model relationships
│   ├── controllers/
│   │   ├── equipmentController.js  # Equipment logic
│   │   ├── teamController.js       # Team logic
│   │   ├── memberController.js     # Member logic
│   │   └── requestController.js    # Request logic
│   ├── routes/
│   │   ├── equipment.js            # Equipment routes
│   │   ├── teams.js                # Team routes
│   │   ├── members.js              # Member routes
│   │   └── requests.js             # Request routes
│   └── index.js                     # Server entry point
│
├── client/                          # Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx          # Main layout
│   │   │   ├── Button.tsx          # Button component
│   │   │   ├── Modal.tsx           # Modal component
│   │   │   ├── Badge.tsx           # Badge component
│   │   │   ├── RequestModal.tsx    # Request form
│   │   │   ├── EquipmentModal.tsx  # Equipment form
│   │   │   ├── EquipmentDetailModal.tsx
│   │   │   ├── TeamModal.tsx       # Team form
│   │   │   └── MemberModal.tsx     # Member form
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Dashboard page
│   │   │   ├── KanbanBoard.tsx     # Kanban view
│   │   │   ├── CalendarView.tsx    # Calendar view
│   │   │   ├── EquipmentList.tsx   # Equipment page
│   │   │   └── TeamsPage.tsx       # Teams page
│   │   ├── services/
│   │   │   ├── api.ts              # Base API config
│   │   │   ├── equipmentService.ts
│   │   │   ├── teamService.ts
│   │   │   └── requestService.ts
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript types
│   │   ├── App.tsx                 # Main app component
│   │   ├── main.tsx                # Entry point
│   │   └── index.css               # Global styles
│   ├── index.html                   # HTML template
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── .env                             # Environment variables
├── .env.example                     # Env template
├── .gitignore
├── package.json                     # Root dependencies
├── README.md                        # Quick start + feature checklist
├── docs/API.md                      # API documentation
├── docs/DEPLOYMENT.md               # Deployment guide
├── docs/USER_GUIDE.md               # End-user manual
├── docs/ARCHITECTURE.md             # This file
└── setup.ps1                        # Setup script
```
