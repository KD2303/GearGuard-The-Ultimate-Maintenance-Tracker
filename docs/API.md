# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Equipment Endpoints

### Get All Equipment
```http
GET /api/equipment
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "CNC Machine 01",
    "serialNumber": "SN12345",
    "category": "Machine",
    "department": "Production",
    "location": "Building A, Floor 2",
    "status": "active",
    "maintenanceTeam": { ... },
    "defaultTechnician": { ... },
    "openRequestsCount": 2
  }
]
```

### Get Equipment by ID
```http
GET /api/equipment/:id
```

### Get Equipment Maintenance History
```http
GET /api/equipment/:id/maintenance
```

### Create Equipment
```http
POST /api/equipment
Content-Type: application/json

{
  "name": "CNC Machine 01",
  "serialNumber": "SN12345",
  "category": "Machine",
  "location": "Building A",
  "maintenanceTeamId": "team-uuid",
  "defaultTechnicianId": "member-uuid"
}
```

### Update Equipment
```http
PUT /api/equipment/:id
Content-Type: application/json

{
  "status": "under-maintenance"
}
```

### Delete Equipment
```http
DELETE /api/equipment/:id
```

## Maintenance Team Endpoints

### Get All Teams
```http
GET /api/teams
```

### Get Team by ID
```http
GET /api/teams/:id
```

### Create Team
```http
POST /api/teams
Content-Type: application/json

{
  "name": "Mechanics",
  "specialization": "Heavy Machinery",
  "description": "Team handling all mechanical repairs",
  "isActive": true
}
```

### Update Team
```http
PUT /api/teams/:id
```

### Delete Team
```http
DELETE /api/teams/:id
```

## Team Member Endpoints

### Get All Members
```http
GET /api/members
```

### Create Member
```http
POST /api/members
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "Senior Technician",
  "teamId": "team-uuid",
  "isActive": true
}
```

### Update Member
```http
PUT /api/members/:id
```

### Delete Member
```http
DELETE /api/members/:id
```

## Maintenance Request Endpoints

### Get All Requests
```http
GET /api/requests?stage=new&type=corrective&teamId=uuid
```

**Query Parameters:**
- `stage`: Filter by stage (new, in-progress, repaired, scrap)
- `type`: Filter by type (corrective, preventive)
- `teamId`: Filter by team

### Get Request by ID
```http
GET /api/requests/:id
```

### Create Request
```http
POST /api/requests
Content-Type: application/json

{
  "subject": "Leaking Oil",
  "description": "Machine is leaking oil from the main shaft",
  "type": "corrective",
  "priority": "high",
  "equipmentId": "equipment-uuid",
  "scheduledDate": "2024-12-28T10:00:00Z"
}
```

**Auto-fill Logic:** When `equipmentId` is provided, the system automatically fills:
- `teamId` from equipment's maintenance team
- `assignedToId` from equipment's default technician

### Update Request
```http
PUT /api/requests/:id
Content-Type: application/json

{
  "stage": "in-progress",
  "duration": 2.5,
  "notes": "Replaced oil seal"
}
```

### Update Request Stage (Kanban)
```http
PATCH /api/requests/:id/stage
Content-Type: application/json

{
  "stage": "repaired"
}
```

**Scrap Logic:** When stage is set to "scrap", the equipment status automatically updates to "scrapped".

### Delete Request
```http
DELETE /api/requests/:id
```

### Get Calendar Events
```http
GET /api/requests/calendar?start=2024-01-01&end=2024-12-31
```

Returns all preventive maintenance requests scheduled within the date range.

## Status Codes

- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `400 Bad Request`: Invalid data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Data Models

### Equipment Status
- `active`: Equipment is operational
- `inactive`: Equipment is not in use
- `under-maintenance`: Equipment is being repaired
- `scrapped`: Equipment is no longer usable

### Request Stages
- `new`: Request just created
- `in-progress`: Technician is working on it
- `repaired`: Work completed successfully
- `scrap`: Equipment marked for scrapping

### Request Types
- `corrective`: Unplanned breakdown repair
- `preventive`: Planned routine maintenance

### Request Priority
- `low`: Can wait
- `medium`: Normal priority
- `high`: Needs attention soon
- `urgent`: Critical, immediate action required
