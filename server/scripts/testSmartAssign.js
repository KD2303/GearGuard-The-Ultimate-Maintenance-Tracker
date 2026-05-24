const { syncDatabase, MaintenanceRequest, MaintenanceTeam, TeamMember, Equipment } = require('../models');

async function test() {
  console.log("🚀 Starting Smart Workload Assigner Dry-Run Test...");
  
  // 1. Connect to DB
  await syncDatabase();

  // 2. Print existing teams and technicians for context
  const teams = await MaintenanceTeam.find({});
  console.log(`\n📋 Teams found in database (${teams.length}):`);
  teams.forEach(t => {
    console.log(` - Team ID: ${t._id} | Name: "${t.name}" | Specialization: "${t.specialization}"`);
  });

  const techs = await TeamMember.find({});
  console.log(`\n👥 Technicians found in database (${techs.length}):`);
  techs.forEach(tech => {
    console.log(` - Tech ID: ${tech._id} | Name: "${tech.name}" | Team ID: ${tech.teamId} | Active: ${tech.isActive}`);
  });

  // 3. Find an unassigned request
  const request = await MaintenanceRequest.findOne({ assignedToId: null });
  if (!request) {
    console.log("\n⚠️ No unassigned requests found in the database. Creating a mock request...");
    // Let's create a temporary mock request for testing if none exist
    const mockRequest = new MaintenanceRequest({
      requestNumber: `REQ-MOCK-${Date.now().toString().slice(-4)}`,
      subject: "Test Specialization Auto-Routing",
      description: "Testing workload allocation rules.",
      type: "corrective",
      stage: "new",
      priority: "high",
      teamId: teams[0]?._id, // Assign to the first team
    });
    await mockRequest.save();
    console.log(`✓ Mock request created: ${mockRequest.requestNumber} (ID: ${mockRequest._id})`);
    await runAssigner(mockRequest._id);
    // Cleanup mock request after testing
    await MaintenanceRequest.deleteOne({ _id: mockRequest._id });
    console.log("✓ Mock request cleaned up successfully.");
  } else {
    console.log(`\n🔍 Found unassigned request: "${request.subject}" (${request.requestNumber}) (ID: ${request._id})`);
    await runAssigner(request._id);
  }

  process.exit(0);
}

async function runAssigner(requestId) {
  try {
    const request = await MaintenanceRequest.findById(requestId);
    if (!request) {
      console.log("❌ Request not found.");
      return;
    }

    let targetSpecialization = null;
    let teamIds = [];

    // 1. Resolve Specialization & Teams
    if (request.teamId) {
      const team = await MaintenanceTeam.findById(request.teamId);
      if (team) {
        targetSpecialization = team.specialization;
        teamIds.push(team._id);
        console.log(`[Specialization Search] Found team "${team.name}" matching direct teamId.`);
      }
    }

    if (!targetSpecialization && request.equipmentId) {
      const equipment = await Equipment.findById(request.equipmentId);
      if (equipment && equipment.maintenanceTeamId) {
        const team = await MaintenanceTeam.findById(equipment.maintenanceTeamId);
        if (team) {
          targetSpecialization = team.specialization;
          teamIds.push(team._id);
          console.log(`[Specialization Search] Found team "${team.name}" matching equipment.maintenanceTeamId.`);
        }
      }
    }

    if (targetSpecialization) {
      const matchingTeams = await MaintenanceTeam.find({ specialization: targetSpecialization, isActive: true });
      const matchingTeamIds = matchingTeams.map(t => t._id);
      teamIds = Array.from(new Set([...teamIds, ...matchingTeamIds]));
      console.log(`[Specialization Search] Resolved specialization: "${targetSpecialization}". Matching Teams Count: ${matchingTeams.length}`);
    }

    if (teamIds.length === 0) {
      console.log("❌ Could not determine specialization/team.");
      return;
    }

    // 2. Find All Active Technicians in these Teams
    const technicians = await TeamMember.find({ teamId: { $in: teamIds }, isActive: true });
    console.log(`[Technician Search] Active technicians found in target teams: ${technicians.length}`);
    if (technicians.length === 0) {
      console.log("❌ No active technicians found.");
      return;
    }

    // 3. Query workload counts for these technicians (new and in-progress requests)
    const activeRequests = await MaintenanceRequest.find({
      stage: { $in: ['new', 'in-progress'] },
      assignedToId: { $in: technicians.map(tech => tech._id) }
    });

    const workloadMap = {};
    technicians.forEach(tech => {
      workloadMap[tech._id.toString()] = 0;
    });
    activeRequests.forEach(r => {
      if (r.assignedToId) {
        const techIdStr = r.assignedToId.toString();
        if (workloadMap[techIdStr] !== undefined) {
          workloadMap[techIdStr]++;
        }
      }
    });

    console.log("\n📊 Technician Current Workloads (active tickets):");
    technicians.forEach(tech => {
      console.log(` - Tech: "${tech.name}" | Current Workload: ${workloadMap[tech._id.toString()]} active tickets`);
    });

    // 4. Identify optimal technician with lowest workload
    let bestTechnician = null;
    let minWorkload = Infinity;

    for (const tech of technicians) {
      const workload = workloadMap[tech._id.toString()];
      if (workload < minWorkload) {
        minWorkload = workload;
        bestTechnician = tech;
      }
    }

    console.log(`\n🎯 Candidate selected: "${bestTechnician.name}" with workload of ${minWorkload} active tickets.`);

    // 5. Apply capacity protection limit (MAX_WORKLOAD = 5)
    const MAX_WORKLOAD = 5;
    if (minWorkload >= MAX_WORKLOAD) {
      console.log(`❌ FAILED CAPACITY VALIDATION: Lowest workload ${minWorkload} is >= max threshold of ${MAX_WORKLOAD}.`);
      return;
    }

    console.log(`✅ SUCCESS: Technician "${bestTechnician.name}" passes workload verification and would be auto-assigned!`);
  } catch (error) {
    console.error("❌ Error in dry-run:", error);
  }
}

test();
