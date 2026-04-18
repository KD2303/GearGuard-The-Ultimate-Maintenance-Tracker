# 🛠️ GearGuard: The Ultimate Maintenance Tracker

A production-ready maintenance management system for tracking assets and managing maintenance requests.

---

## 🌸 Nexus Spring of Code 2026

This project is officially participating in **Nexus Spring of Code (NSoC) 2026** 🚀

We welcome contributors to collaborate, learn, and build impactful features.

---

## ✨ Features

✅ Equipment Management (Machines, Vehicles, Computers)\
✅ Maintenance Team Management\
✅ Maintenance Request Tracking (Corrective & Preventive)\
✅ Kanban Board with Drag & Drop\
✅ Calendar View for Preventive Maintenance\
✅ Smart Buttons & Auto-fill Logic\
✅ Overdue Indicators\

---

## 🛠️ Tech Stack

* **Backend:** Node.js + Express + MongoDB + Mongoose
* **Frontend:** React + TypeScript + Vite + Tailwind CSS
* **UI Libraries:** React DnD, React Big Calendar

---

## ⚙️ Quick Start

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Setup Database

```bash
cp .env.example .env
# Add your MongoDB URI
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Production Build

```bash
npm run build
npm start
```

---

## 🗄️ Database Setup

The application uses MongoDB. Ensure your `MONGO_URI` is properly configured.

---

## 🔌 API Endpoints

### Equipment

* GET /api/equipment
* POST /api/equipment
* PUT /api/equipment/:id
* DELETE /api/equipment/:id

### Teams

* GET /api/teams
* POST /api/teams
* PUT /api/teams/:id
* DELETE /api/teams/:id

### Maintenance Requests

* GET /api/requests
* POST /api/requests
* PUT /api/requests/:id
* PATCH /api/requests/:id/stage
* DELETE /api/requests/:id

---

## 📁 Project Structure

```
gearguard/
├── server/
├── client/
└── package.json
```

### Documentation Map

- [README.md](README.md): Quick start, contributor notes, and full feature checklist
- [docs/API.md](docs/API.md): Complete endpoint reference and request/response examples
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): System architecture and module relationships
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Production deployment and operations guidance
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md): End-user workflows and application usage

### Project Status Snapshot

- Production-ready maintenance management workflow is implemented end-to-end
- Core modules delivered: Equipment, Teams, Members, and Maintenance Requests
- Views delivered: Dashboard, Kanban Board, Calendar, Equipment, and Teams
- Smart behaviors delivered: auto-fill assignment, stage transitions, scrap handling, overdue indicators, and request numbering

### First-Time Setup Flow

1. Run PowerShell setup: `./setup.ps1`
2. Configure environment in `.env` with a valid `MONGO_URI`
3. Start the app with `npm run dev`
4. Open the app and create a team, add members, register equipment, and create requests

### Quick Troubleshooting

- Database issues: verify MongoDB availability and `.env` values
- Port conflicts: change `PORT` in `.env` or stop conflicting processes
- Dependency issues: reinstall packages after clearing `node_modules`
- For full production troubleshooting and hardening, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 🤝 Contributing (NSoC 2026)

* Check issues and request assignment
* Do NOT create PR without assignment
* Mention `NSoC'26` in every PR
* Follow `CONTRIBUTING.md`

---

## 🏷️ Issue Labels

* **level1 — 3 pts** → Beginner
* **level2 — 5 pts** → Intermediate
* **level3 — 10 pts** → Advanced

---

## ⚠️ Contribution Rules

* PR without assignment → ❌ Rejected
* Missing `NSoC'26` → ⚠️ Update required
* Low-quality PR → ❌ Not merged

---

## ⭐ Support

If you like this project, give it a ⭐ and contribute!

---

## ✅ Detailed Feature Implementation Checklist

This section consolidates the complete implementation checklist that was previously maintained as a standalone document.

### Core Modules

#### Equipment Management
- ✅ Equipment database with all required fields
	- ✅ Name and Serial Number
	- ✅ Purchase Date and Warranty Information
	- ✅ Location (physical location)
	- ✅ Category (Machine, Vehicle, Computer)
	- ✅ Department tracking
	- ✅ Employee assignment
	- ✅ Manufacturer and Model
	- ✅ Status (active, inactive, under-maintenance, scrapped)
- ✅ Equipment CRUD operations
- ✅ Equipment list view with cards
- ✅ Equipment detail modal
- ✅ Search/filter by department and employee (via API)
- ✅ Link to Maintenance Team
- ✅ Link to Default Technician

#### Maintenance Team
- ✅ Team database with required fields
	- ✅ Team Name
	- ✅ Specialization
	- ✅ Description
	- ✅ Active status
- ✅ Team Member database
	- ✅ Name, Email, Phone
	- ✅ Role (Technician, Senior Technician, Manager)
	- ✅ Team assignment
	- ✅ Avatar support
- ✅ Team management UI
- ✅ Member management UI
- ✅ Team-member relationships

#### Maintenance Request
- ✅ Request database with all fields
	- ✅ Request Number (auto-generated: REQ-YYYYMM-XXXX)
	- ✅ Subject (what is wrong)
	- ✅ Description
	- ✅ Type (Corrective/Preventive)
	- ✅ Stage (New/In Progress/Repaired/Scrap)
	- ✅ Priority (Low/Medium/High/Urgent)
	- ✅ Scheduled Date
	- ✅ Completed Date
	- ✅ Duration (hours spent)
	- ✅ Cost tracking
	- ✅ Equipment link
	- ✅ Team link
	- ✅ Assigned technician
	- ✅ Created by user
- ✅ Request CRUD operations
- ✅ Request creation modal

### Workflows

#### Flow 1: Corrective Maintenance (Breakdown)
- ✅ Any user can create a request
- ✅ Auto-fill logic implemented:
	- ✅ When equipment is selected
	- ✅ Automatically fetches Equipment Category
	- ✅ Automatically fills Maintenance Team
	- ✅ Automatically assigns default technician
- ✅ Request starts in "New" stage
- ✅ Technician can assign themselves
- ✅ Stage moves to "In Progress"
- ✅ Duration recording
- ✅ Stage moves to "Repaired"
- ✅ Equipment status updates automatically

#### Flow 2: Preventive Maintenance (Routine)
- ✅ Manager can create preventive request
- ✅ Scheduled Date setting
- ✅ Calendar view shows scheduled requests
- ✅ Date-based filtering

### User Interface and Views

#### 1. Kanban Board
- ✅ Primary workspace for technicians
- ✅ Grouped by stages (New | In Progress | Repaired | Scrap)
- ✅ Drag and Drop functionality (React DnD)
- ✅ Visual indicators:
	- ✅ Technician avatar/name display
	- ✅ Overdue requests shown in red
	- ✅ Priority badges
	- ✅ Request type badges
	- ✅ Equipment name display
- ✅ Request count per stage
- ✅ Responsive card design
- ✅ Hover effects

#### 2. Calendar View
- ✅ Display all preventive maintenance requests
- ✅ Date-based visualization (React Big Calendar)
- ✅ Click date to schedule new maintenance
- ✅ Event details on click
- ✅ Month/Week/Day views

#### 3. Dashboard
- ✅ Statistics overview
	- ✅ Total Requests
	- ✅ New Requests count
	- ✅ In Progress count
	- ✅ Total Equipment
	- ✅ Under Maintenance count
	- ✅ Teams count
- ✅ Recent requests list
- ✅ Quick navigation

#### 4. Equipment List
- ✅ Card-based grid layout
- ✅ Status badges
- ✅ Location display
- ✅ Department display
- ✅ Purchase date
- ✅ Smart button (see below)
- ✅ Click to view details

#### 5. Teams Page
- ✅ Team cards with members
- ✅ Specialization display
- ✅ Active status indicator
- ✅ Add team functionality
- ✅ Add member functionality
- ✅ Member role display

### Smart Features and Automation

#### Smart Buttons
- ✅ Equipment Form has "Maintenance" button
- ✅ Shows count of open requests as badge
- ✅ Clicking opens filtered maintenance history
- ✅ Shows all requests for that equipment
- ✅ Badge displays open request count

#### Scrap Logic
- ✅ When request moved to "Scrap" stage:
	- ✅ Equipment status updates to "scrapped"
	- ✅ Completed date is set
	- ✅ Equipment no longer shows as active
	- ✅ Note/log is created

#### Auto-fill Logic
- ✅ Equipment selection triggers:
	- ✅ Team auto-population
	- ✅ Technician auto-population
	- ✅ Category inheritance
- ✅ Equipment status auto-updates:
	- ✅ "under-maintenance" when request created
	- ✅ "active" when repaired
	- ✅ "scrapped" when scrapped

#### Overdue Indicators
- ✅ Red border on overdue request cards
- ✅ Alert icon for overdue items
- ✅ Calculated based on scheduled date vs current date
- ✅ Only shown for non-repaired requests

#### Request Numbering
- ✅ Auto-generated request numbers
- ✅ Format: REQ-YYYYMM-XXXX
- ✅ Sequential numbering per month
- ✅ Unique constraint

### Technical Implementation

#### Backend (Node.js + Express + MongoDB)
- ✅ RESTful API architecture
- ✅ Mongoose ODM for MongoDB
- ✅ Database models with relationships (references and populated fields)
- ✅ Controllers for business logic
- ✅ Routes for API endpoints
- ✅ Error handling middleware
- ✅ CORS enabled
- ✅ Request logging (Morgan)
- ✅ Environment configuration
- ✅ Auto database sync

#### Frontend (React + TypeScript + Vite)
- ✅ TypeScript for type safety
- ✅ React Router for navigation
- ✅ Axios for API calls
- ✅ React DnD for drag and drop
- ✅ React Big Calendar for scheduling
- ✅ Tailwind CSS for styling
- ✅ Lucide React for icons
- ✅ Component-based architecture
- ✅ Service layer for API
- ✅ Modal components
- ✅ Reusable UI components
- ✅ Responsive design

#### Database Schema
- ✅ Equipment collection
- ✅ MaintenanceTeam collection
- ✅ TeamMember collection
- ✅ MaintenanceRequest collection
- ✅ Proper relationships via ObjectId references
- ✅ Indexes on key fields
- ✅ Timestamps (createdAt, updatedAt)

### Production Ready Features

#### Configuration
- ✅ Environment variables (.env)
- ✅ Separate dev/prod configs
- ✅ Database configuration
- ✅ Port configuration

#### Documentation
- ✅ README.md with quick start and complete checklist
- ✅ docs/API.md with endpoint documentation
- ✅ docs/DEPLOYMENT.md with production guide
- ✅ docs/ARCHITECTURE.md with system design
- ✅ docs/USER_GUIDE.md with end-user guide
- ✅ Inline code comments

#### Deployment
- ✅ Production build scripts
- ✅ Setup automation script (setup.ps1)
- ✅ Docker deployment guide
- ✅ Cloud deployment options
- ✅ Database backup strategy
- ✅ Security considerations documented

#### Error Handling
- ✅ API error responses
- ✅ Frontend error catching
- ✅ User-friendly error messages
- ✅ Console logging for debugging
- ✅ Validation on forms

#### Performance
- ✅ Database indexes
- ✅ Optimized queries
- ✅ Frontend code splitting (Vite)
- ✅ Production build optimization

### Feature Coverage from Specification

All major requirements from the project specification are implemented:

- ✅ Equipment tracking by department and employee
- ✅ Maintenance team management with specializations
- ✅ Maintenance request lifecycle (New → In Progress → Repaired → Scrap)
- ✅ Corrective (breakdown) and Preventive (routine) maintenance types
- ✅ Kanban board with drag and drop
- ✅ Calendar view for preventive maintenance
- ✅ Smart buttons with request counts
- ✅ Auto-fill logic from equipment
- ✅ Scrap logic with equipment status update
- ✅ Overdue indicators
- ✅ Visual indicators (avatars, status colors)
- ✅ Equipment details (serial, purchase date, warranty, location)
- ✅ Request details (subject, scheduled date, duration)

### Ready for Production

The application is production-ready with:
- Complete feature set as per specification
- RESTful API architecture
- Modern React frontend
- MongoDB data layer with Mongoose models
- Comprehensive documentation
- Deployment guides
- Error handling
- Security considerations
- Scalable architecture

### Next Steps (Optional Enhancements)

Potential future enhancements:
- User authentication and authorization
- File attachments for requests
- Email notifications
- Mobile app version
- Advanced reporting and analytics
- Export to PDF/Excel
- Real-time notifications (WebSockets)
- Multi-language support
- Dark mode
- Advanced search and filtering
