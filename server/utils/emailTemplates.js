const assignmentTemplate = (request) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>📌 New Request Assigned</h2>

      <p>A request has been assigned to you.</p>

      <hr />

      <p><strong>Request ID:</strong> ${request.id}</p>
      <p><strong>Status:</strong> ${request.status}</p>

      <p>Please login to GearGuard dashboard.</p>
    </div>
  `;
};

const completionTemplate = (request) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>✅ Request Completed</h2>

      <p>Your request has been completed successfully.</p>

      <hr />

      <p><strong>Request ID:</strong> ${request.id}</p>
    </div>
  `;
};

const overdueTemplate = (request) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>⚠️ Request Overdue</h2>

      <p>This request is overdue.</p>

      <hr />

      <p><strong>Request ID:</strong> ${request.id}</p>
    </div>
  `;
};

module.exports = {
  assignmentTemplate,
  completionTemplate,
  overdueTemplate,
};