# 🚀 GearGuard - Complete User Guide

## 📋 Table of Contents
1. [Project Setup](#project-setup)
2. [Application Features](#application-features)
3. [Database Structure](#database-structure)
4. [Step-by-Step Usage Guide](#step-by-step-usage-guide)
5. [API Endpoints](#api-endpoints)

---

## 🛠️ Project Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation Steps

#### 1. **Clone and Install Dependencies**
```bash
# Navigate to project root
cd "D:\Dev Stuff\Gear Guard"

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

#### 2. **Database Setup**
```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE gearguard;
\q

# The database tables will be created automatically by Sequelize
```

#### 3. **Environment Configuration**
Create `.env` file in the server directory:
```env
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/gearguard
NODE_ENV=development
```

#### 4. **Start the Application**

**Terminal 1 - Start Backend Server:**
```bash
cd server
node index.js
# Server runs on http://localhost:3001
```

**Terminal 2 - Start Frontend Client:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

---

## 🎯 Application Features

### 1. **Dashboard** (Home Page)
- **Quick Action Cards**: Create new tasks and manage to-dos
- **Statistics Overview**: View all key metrics at a glance
- **Recent Activity Feed**: See team actions and updates
- **Recent Requests**: Monitor latest maintenance requests

### 2. **Kanban Board** (`/requests`)
- Visual workflow management
- Drag-and-drop maintenance requests
- 4 Stages: New → In Progress → Repaired → Scrap

### 3. **All Requests Table** (`/requests-all`)
- Comprehensive table view of all requests
- Sortable columns
- Expandable rows for detailed information
- Filter and search functionality

### 4. **Calendar View** (`/calendar`)
- Timeline visualization of maintenance schedules
- Monthly/Weekly/Daily views
- Scheduled maintenance dates
- Click to view/edit requests

### 5. **Equipment Management** (`/equipment`)
- Resource Manager with detailed equipment specs
- Equipment status tracking
- Maintenance team assignments
- Card view for quick overview

### 6. **Teams Management** (`/teams`)
- Create and manage maintenance teams
- Add team members with roles
- Assignment panel with calendar
- Team availability tracking

### 7. **Activity Log** (`/activity`)
- Complete audit trail
- Filter by activity type
- Detailed descriptions and timestamps
- User action tracking

---

## 🗄️ Database Structure

### **Tables and Data Storage**

#### 1. **MaintenanceTeams Table**
Stores maintenance team information.

**Columns:**
- `id` (UUID, Primary Key)
- `name` (String) - Team name
- `description` (Text) - Team description
- `specialization` (String) - Team specialty (e.g., "Hydraulics", "Electrical")
- `isActive` (Boolean) - Active status
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**What gets stored:**
```javascript
{
  id: "uuid-123",
  name: "Hydraulic Systems Team",
  description: "Specialists in hydraulic equipment",
  specialization: "Hydraulics",
  isActive: true,
  createdAt: "2025-12-27T10:00:00Z",
  updatedAt: "2025-12-27T10:00:00Z"
}
```

#### 2. **TeamMembers Table**
Stores individual team member information.

**Columns:**
- `id` (UUID, Primary Key)
- `name` (String) - Member name
- `email` (String) - Email address
- `phone` (String) - Phone number
- `role` (String) - Job role/title
- `avatar` (String) - Profile image URL
- `isActive` (Boolean) - Active status
- `teamId` (UUID, Foreign Key) - Links to MaintenanceTeams
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**What gets stored:**
```javascript
{
  id: "uuid-456",
  name: "John Smith",
  email: "john@example.com",
  phone: "+1-234-567-8900",
  role: "Senior Technician",
  avatar: "https://...",
  isActive: true,
  teamId: "uuid-123",
  createdAt: "2025-12-27T10:00:00Z"
}
```

#### 3. **Equipment Table**
Stores all equipment/asset information.

**Columns:**
- `id` (UUID, Primary Key)
- `name` (String) - Equipment name
- `serialNumber` (String, Unique) - Serial number
- `category` (String) - Equipment category
- `department` (String) - Department using equipment
- `assignedTo` (String) - Person assigned to
- `location` (String) - Physical location
- `purchaseDate` (Date) - Purchase date
- `warrantyExpiry` (Date) - Warranty end date
- `manufacturer` (String) - Manufacturer name
- `model` (String) - Model number
- `status` (Enum) - 'active', 'inactive', 'scrapped', 'under-maintenance'
- `notes` (Text) - Additional notes
- `maintenanceTeamId` (UUID, Foreign Key) - Default maintenance team
- `defaultTechnicianId` (UUID, Foreign Key) - Default technician
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**What gets stored:**
```javascript
{
  id: "uuid-789",
  name: "Hydraulic Press #1",
  serialNumber: "HP-2024-001",
  category: "Heavy Machinery",
  department: "Production",
  assignedTo: "Production Floor A",
  location: "Building 2, Floor 1",
  purchaseDate: "2024-01-15",
  warrantyExpiry: "2027-01-15",
  manufacturer: "HydroTech Industries",
  model: "HT-5000",
  status: "active",
  notes: "High-pressure hydraulic press for metal forming",
  maintenanceTeamId: "uuid-123",
  defaultTechnicianId: "uuid-456",
  createdAt: "2024-01-15T10:00:00Z"
}
```

#### 4. **MaintenanceRequests Table**
Stores all maintenance request records.

**Columns:**
- `id` (UUID, Primary Key)
- `requestNumber` (String, Unique) - Auto-generated request number
- `subject` (String) - Request title
- `description` (Text) - Detailed description
- `type` (Enum) - 'corrective' or 'preventive'
- `stage` (Enum) - 'new', 'in-progress', 'repaired', 'scrap'
- `priority` (Enum) - 'low', 'medium', 'high', 'urgent'
- `scheduledDate` (DateTime) - When maintenance is scheduled
- `completedDate` (DateTime) - When completed
- `duration` (Integer) - Duration in hours
- `cost` (Decimal) - Cost in currency
- `notes` (Text) - Additional notes
- `equipmentId` (UUID, Foreign Key) - Equipment being serviced
- `teamId` (UUID, Foreign Key) - Assigned team
- `assignedToId` (UUID, Foreign Key) - Assigned technician
- `createdById` (UUID, Foreign Key) - Who created the request
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**What gets stored:**
```javascript
{
  id: "uuid-101",
  requestNumber: "MR-2025-001",
  subject: "Hydraulic Press - Oil Leak Repair",
  description: "Detected oil leak from main cylinder seal",
  type: "corrective",
  stage: "in-progress",
  priority: "high",
  scheduledDate: "2025-12-28T08:00:00Z",
  completedDate: null,
  duration: 4,
  cost: 350.00,
  notes: "Ordered new seal kit - ETA 2 days",
  equipmentId: "uuid-789",
  teamId: "uuid-123",
  assignedToId: "uuid-456",
  createdById: "uuid-456",
  createdAt: "2025-12-27T14:30:00Z"
}
```

### **Database Relationships**

```
MaintenanceTeams (1) ----< (Many) TeamMembers
       |                           |
       |                           |
       |                           |
       v                           v
Equipment (Many) >---- (1) MaintenanceRequests
```

**Relationships Explained:**
1. **Teams → Members**: One team has many members
2. **Equipment → Team**: Equipment has one default maintenance team
3. **Equipment → Technician**: Equipment has one default technician
4. **Request → Equipment**: Request is for one equipment
5. **Request → Team**: Request assigned to one team
6. **Request → Member**: Request assigned to one member

---

## 📖 Step-by-Step Usage Guide

### **Scenario 1: Setting Up Your First Team**

#### Step 1: Navigate to Teams Page
- Click **"Teams"** in the navigation bar
- You'll see the Teams Management page

#### Step 2: Create a New Team
1. Click **"+ Add Team"** button (top right)
2. Fill in the form:
   - **Name**: "Hydraulic Systems Team"
   - **Description**: "Specialists in hydraulic equipment maintenance"
   - **Specialization**: "Hydraulics"
   - **Status**: Active (checked)
3. Click **"Create Team"**

**Database Action:**
```sql
INSERT INTO MaintenanceTeams (name, description, specialization, isActive)
VALUES ('Hydraulic Systems Team', 'Specialists...', 'Hydraulics', true);
```

#### Step 3: Add Team Members
1. In the team card, click **"Add Member"**
2. Fill in member details:
   - **Name**: "John Smith"
   - **Email**: "john@example.com"
   - **Phone**: "+1-234-567-8900"
   - **Role**: "Senior Technician"
   - Select the team from dropdown
3. Click **"Add Member"**

**Database Action:**
```sql
INSERT INTO TeamMembers (name, email, phone, role, teamId)
VALUES ('John Smith', 'john@example.com', '+1-234-567-8900', 'Senior Technician', 'team-uuid');
```

---

### **Scenario 2: Adding Equipment**

#### Step 1: Go to Equipment Page
- Click **"Equipment"** in navigation

#### Step 2: Add New Equipment
1. Click **"+ Add Equipment"** button
2. Fill in equipment details:
   - **Name**: "Hydraulic Press #1"
   - **Serial Number**: "HP-2024-001"
   - **Category**: "Heavy Machinery"
   - **Location**: "Building 2, Floor 1"
   - **Manufacturer**: "HydroTech Industries"
   - **Model**: "HT-5000"
   - **Purchase Date**: Select date
   - **Status**: Active
   - **Maintenance Team**: Select team
   - **Default Technician**: Select member
3. Click **"Save Equipment"**

**Database Action:**
```sql
INSERT INTO Equipment (name, serialNumber, category, location, manufacturer, model, status, maintenanceTeamId, defaultTechnicianId)
VALUES ('Hydraulic Press #1', 'HP-2024-001', 'Heavy Machinery', 'Building 2, Floor 1', 'HydroTech Industries', 'HT-5000', 'active', 'team-uuid', 'member-uuid');
```

---

### **Scenario 3: Creating a Maintenance Request**

#### Step 1: Navigate to Dashboard or Kanban
- From Dashboard: Click **"+ New Maintenance Request"** in Quick Actions
- OR Go to **"Kanban"** page and click **"+ New Request"**

#### Step 2: Fill Request Details
1. **Subject**: "Hydraulic Press - Oil Leak Repair"
2. **Description**: Detailed problem description
3. **Type**: 
   - **Corrective**: Fix a problem
   - **Preventive**: Scheduled maintenance
4. **Priority**: High, Medium, Low, Urgent
5. **Equipment**: Select from dropdown
6. **Assign To Team**: Select team
7. **Assign To Member**: Select technician
8. **Schedule Date**: Pick date and time
9. Click **"Create Request"**

**Database Action:**
```sql
INSERT INTO MaintenanceRequests 
(requestNumber, subject, description, type, stage, priority, scheduledDate, equipmentId, teamId, assignedToId, createdById)
VALUES 
('MR-2025-001', 'Hydraulic Press - Oil Leak Repair', 'Detected oil leak...', 'corrective', 'new', 'high', '2025-12-28 08:00:00', 'equipment-uuid', 'team-uuid', 'member-uuid', 'creator-uuid');
```

---

### **Scenario 4: Managing Requests on Kanban Board**

#### Step 1: View Kanban Board
- Click **"Kanban"** in navigation
- See 4 columns: New, In Progress, Repaired, Scrap

#### Step 2: Move Request Through Workflow
1. **Drag** a request card from "New" to "In Progress"
   - Request stage updates to 'in-progress' in database
   
2. **Click** on a request card to:
   - View full details
   - Add notes
   - Update cost/duration
   - Change priority
   - Upload documents (if implemented)

3. When work is complete, **drag** to "Repaired"
   - Request stage updates to 'repaired'
   - System records completion date

**Database Actions:**
```sql
-- Moving to In Progress
UPDATE MaintenanceRequests 
SET stage = 'in-progress', updatedAt = NOW()
WHERE id = 'request-uuid';

-- Completing Request
UPDATE MaintenanceRequests 
SET stage = 'repaired', completedDate = NOW(), updatedAt = NOW()
WHERE id = 'request-uuid';
```

---

### **Scenario 5: Viewing Detailed Request Table**

#### Step 1: Go to All Requests Page
- Click **"All Requests"** in navigation

#### Step 2: Explore Table Features
1. **Sort Columns**: Click column headers to sort
   - Date, Priority, Stage, Equipment, Assigned To
2. **Expand Rows**: Click "Expand" to see full details
   - Description, scheduled date, cost, duration, notes
3. **Search**: Use search bar to find specific requests
4. **Filter**: Filter by status, priority, team

---

### **Scenario 6: Using Calendar View**

#### Step 1: Open Calendar
- Click **"Calendar"** in navigation

#### Step 2: View Scheduled Maintenance
1. **Monthly View**: See all scheduled requests
2. **Weekly View**: Detailed week schedule
3. **Daily View**: Day-by-day tasks

#### Step 3: Schedule New Maintenance
1. **Click** on a date in calendar
2. Creates new request with that date pre-filled
3. Fill remaining details
4. Request appears on calendar

---

### **Scenario 7: Monitoring Activity Log**

#### Step 1: Access Activity Page
- Click **"Activity"** in navigation

#### Step 2: Review Actions
View complete audit trail:
- Request created
- Status changes
- Team assignments
- Equipment updates
- Member additions
- Completions

#### Step 3: Filter Activities
1. Use filter buttons: All, Requests, Updates, Completed, Equipment
2. See detailed descriptions with timestamps
3. Track who did what and when

---

## 🔌 API Endpoints

### **Teams API**

```javascript
// Get all teams
GET /api/teams

// Create team
POST /api/teams
Body: { name, description, specialization, isActive }

// Update team
PUT /api/teams/:id
Body: { name, description, specialization, isActive }

// Delete team
DELETE /api/teams/:id
```

### **Members API**

```javascript
// Get all members
GET /api/members

// Create member
POST /api/members
Body: { name, email, phone, role, teamId, isActive }

// Update member
PUT /api/members/:id

// Delete member
DELETE /api/members/:id
```

### **Equipment API**

```javascript
// Get all equipment
GET /api/equipment

// Create equipment
POST /api/equipment
Body: { 
  name, serialNumber, category, department, 
  location, manufacturer, model, status, 
  maintenanceTeamId, defaultTechnicianId 
}

// Update equipment
PUT /api/equipment/:id

// Delete equipment
DELETE /api/equipment/:id

// Get equipment by ID with relationships
GET /api/equipment/:id
```

### **Requests API**

```javascript
// Get all requests
GET /api/requests

// Create request
POST /api/requests
Body: {
  subject, description, type, priority,
  scheduledDate, equipmentId, teamId,
  assignedToId, createdById
}

// Update request
PUT /api/requests/:id

// Update request stage (for Kanban)
PATCH /api/requests/:id/stage
Body: { stage: 'new' | 'in-progress' | 'repaired' | 'scrap' }

// Delete request
DELETE /api/requests/:id

// Get calendar events
GET /api/requests/calendar
```

---

## 📊 Data Flow Example

### **Complete Flow: Creating and Completing a Request**

```
1. USER ACTION: Create Request on Dashboard
   ↓
2. FRONTEND: Send POST request to /api/requests
   ↓
3. BACKEND: Validate data
   ↓
4. DATABASE: INSERT into MaintenanceRequests table
   ↓
5. BACKEND: Return created request with ID
   ↓
6. FRONTEND: Update UI, show success message
   ↓
7. USER ACTION: View on Kanban board
   ↓
8. FRONTEND: GET /api/requests, display in "New" column
   ↓
9. USER ACTION: Drag to "In Progress"
   ↓
10. FRONTEND: PATCH /api/requests/:id/stage { stage: 'in-progress' }
    ↓
11. DATABASE: UPDATE stage = 'in-progress', updatedAt = NOW()
    ↓
12. FRONTEND: Request moves to "In Progress" column
    ↓
13. USER ACTION: Add completion notes, drag to "Repaired"
    ↓
14. DATABASE: UPDATE stage = 'repaired', completedDate = NOW()
    ↓
15. ACTIVITY LOG: Record completion action
    ↓
16. STATISTICS: Update dashboard counters
```

---

## 🎓 Best Practices

### **1. Team Organization**
- Create teams based on specializations
- Assign equipment to appropriate teams
- Keep team member information updated

### **2. Equipment Management**
- Always enter serial numbers for tracking
- Set default maintenance teams
- Update status when equipment is serviced

### **3. Request Management**
- Use clear, descriptive subjects
- Set appropriate priorities
- Schedule preventive maintenance in advance
- Add detailed notes for technicians

### **4. Workflow**
- Move requests through stages promptly
- Update completion dates
- Record costs and durations
- Review activity logs regularly

---

## 🐛 Troubleshooting

### **Common Issues**

**1. Can't Create Request**
- Ensure equipment exists
- Check team and member assignments
- Verify all required fields

**2. Kanban Not Updating**
- Refresh page
- Check network connection
- Verify backend server is running

**3. Database Errors**
- Check PostgreSQL is running
- Verify connection string in .env
- Ensure database exists

---

## 📝 Summary

**Key Points:**
1. ✅ Teams manage members
2. ✅ Equipment tracked with full details
3. ✅ Requests flow through stages
4. ✅ Everything stored in PostgreSQL
5. ✅ Activity log tracks all actions
6. ✅ Calendar visualizes schedules
7. ✅ Dashboard provides overview

**Database Tables:**
- MaintenanceTeams
- TeamMembers  
- Equipment
- MaintenanceRequests

**All data persists in PostgreSQL with proper relationships!**
