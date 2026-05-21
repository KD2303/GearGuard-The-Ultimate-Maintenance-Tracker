const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Equipment = require('../models/Equipment');
const MaintenanceRequest = require('../models/MaintenanceRequest');

// ─── HELPER: format date ───────────────────────────────────
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ─── EXPORT 1: Equipment List → Excel ─────────────────────
const exportEquipmentExcel = async (req, res) => {
  try {
    const equipment = await Equipment.find()
      .populate('maintenanceTeamId', 'name')
      .populate('defaultTechnicianId', 'name')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GearGuard';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Equipment List');

    // Column definitions
    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 6 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Serial Number', key: 'serialNumber', width: 20 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Location', key: 'location', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Maintenance Team', key: 'team', width: 22 },
      { header: 'Default Technician', key: 'technician', width: 22 },
      { header: 'Purchase Date', key: 'purchaseDate', width: 16 },
      { header: 'Warranty Expiry', key: 'warrantyExpiry', width: 16 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    // Add data rows
    equipment.forEach((eq, index) => {
      const row = sheet.addRow({
        sno: index + 1,
        name: eq.name,
        serialNumber: eq.serialNumber,
        category: eq.category,
        department: eq.department || 'N/A',
        location: eq.location,
        status: eq.status,
        team: eq.maintenanceTeamId?.name || 'Unassigned',
        technician: eq.defaultTechnicianId?.name || 'Unassigned',
        purchaseDate: formatDate(eq.purchaseDate),
        warrantyExpiry: formatDate(eq.warrantyExpiry),
      });

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F8FF' },
        };
      }

      // Color-code status cell
      const statusCell = row.getCell('status');
      if (eq.status === 'active') {
        statusCell.font = { color: { argb: 'FF15803D' }, bold: true };
      } else if (eq.status === 'under-maintenance') {
        statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
      } else if (eq.status === 'scrapped') {
        statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
    });

    // Add border to all cells
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        };
      });
    });

    // Set response headers
    const date = new Date().toISOString().split('T')[0];
    const filename = `equipment-report-${date}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── EXPORT 2: Maintenance Requests → Excel ───────────────
const exportRequestsExcel = async (req, res) => {
  try {
    const {
      stage, priority, type, assignedToId,
      startDate, endDate, search,
    } = req.query;

    const query = {};
    if (stage) query.stage = stage;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (assignedToId) query.assignedToId = assignedToId;
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { requestNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const requests = await MaintenanceRequest.find(query)
      .populate('equipmentId', 'name serialNumber')
      .populate('teamId', 'name')
      .populate('assignedToId', 'name')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GearGuard';
    const sheet = workbook.addWorksheet('Maintenance Requests');

    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 6 },
      { header: 'Request No.', key: 'requestNumber', width: 16 },
      { header: 'Subject', key: 'subject', width: 30 },
      { header: 'Equipment', key: 'equipment', width: 22 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Stage', key: 'stage', width: 14 },
      { header: 'Team', key: 'team', width: 20 },
      { header: 'Assigned To', key: 'assignedTo', width: 20 },
      { header: 'Scheduled Date', key: 'scheduledDate', width: 16 },
      { header: 'Completed Date', key: 'completedDate', width: 16 },
      { header: 'Duration (hrs)', key: 'duration', width: 14 },
    ];

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    const priorityColors = {
      urgent: 'FFDC2626',
      high: 'FFD97706',
      medium: 'FF2563EB',
      low: 'FF15803D',
    };

    requests.forEach((req, index) => {
      const row = sheet.addRow({
        sno: index + 1,
        requestNumber: req.requestNumber,
        subject: req.subject,
        equipment: req.equipmentId?.name || 'N/A',
        type: req.type,
        priority: req.priority,
        stage: req.stage,
        team: req.teamId?.name || 'Unassigned',
        assignedTo: req.assignedToId?.name || 'Unassigned',
        scheduledDate: formatDate(req.scheduledDate),
        completedDate: formatDate(req.completedDate),
        duration: req.duration || 'N/A',
      });

      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F8FF' },
        };
      }

      // Color priority cell
      const priorityCell = row.getCell('priority');
      const color = priorityColors[req.priority];
      if (color) {
        priorityCell.font = { color: { argb: color }, bold: true };
      }
    });

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        };
      });
    });

    const date = new Date().toISOString().split('T')[0];
    const filename = `maintenance-requests-${date}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── EXPORT 3: Equipment Maintenance History → PDF ────────
const exportEquipmentPDF = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('maintenanceTeamId', 'name')
      .populate('defaultTechnicianId', 'name');

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found.' });
    }

    const requests = await MaintenanceRequest.find({
      equipmentId: equipment._id,
    })
      .populate('assignedToId', 'name')
      .sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const date = new Date().toISOString().split('T')[0];
    const filename = `${equipment.name.replace(/\s+/g, '-')}-report-${date}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ── Header ──
    doc.rect(0, 0, doc.page.width, 80).fill('#1E3A5F');
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
      .text('GearGuard', 50, 25);
    doc.fontSize(11).font('Helvetica')
      .text('Equipment Maintenance Report', 50, 52);
    doc.fillColor('#000000').moveDown(3);

    // ── Equipment Info ──
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1E3A5F')
      .text('Equipment Details', 50, 100);
    doc.moveTo(50, 118).lineTo(545, 118).stroke('#1E3A5F');

    const info = [
      ['Name', equipment.name],
      ['Serial Number', equipment.serialNumber],
      ['Category', equipment.category],
      ['Location', equipment.location],
      ['Department', equipment.department || 'N/A'],
      ['Status', equipment.status],
      ['Maintenance Team', equipment.maintenanceTeamId?.name || 'Unassigned'],
      ['Default Technician', equipment.defaultTechnicianId?.name || 'Unassigned'],
      ['Purchase Date', formatDate(equipment.purchaseDate)],
      ['Warranty Expiry', formatDate(equipment.warrantyExpiry)],
    ];

    let y = 128;
    info.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.rect(50, y - 4, 495, 20).fill('#F5F8FF');
      }
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151')
        .text(label + ':', 55, y, { width: 160 });
      doc.font('Helvetica').fillColor('#111827')
        .text(String(value), 215, y, { width: 330 });
      y += 22;
    });

    // ── Maintenance History Table ──
    y += 16;
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1E3A5F')
      .text('Maintenance History', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(545, y).stroke('#1E3A5F');
    y += 10;

    if (requests.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#6B7280')
        .text('No maintenance records found for this equipment.', 50, y);
    } else {
      // Table header
      const cols = [
        { label: 'Req No.', x: 50, width: 75 },
        { label: 'Subject', x: 125, width: 140 },
        { label: 'Priority', x: 265, width: 65 },
        { label: 'Stage', x: 330, width: 70 },
        { label: 'Assigned To', x: 400, width: 95 },
        { label: 'Scheduled', x: 495, width: 100 },
      ];

      doc.rect(50, y, 495, 18).fill('#1E3A5F');
      cols.forEach((col) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF')
          .text(col.label, col.x + 2, y + 4, { width: col.width });
      });
      y += 18;

      requests.forEach((req, i) => {
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 50;
        }

        const rowHeight = 18;
        if (i % 2 === 0) {
          doc.rect(50, y, 495, rowHeight).fill('#F9FAFB');
        }

        const rowData = [
          { x: 50, width: 75, val: req.requestNumber || 'N/A' },
          { x: 125, width: 140, val: req.subject },
          { x: 265, width: 65, val: req.priority },
          { x: 330, width: 70, val: req.stage },
          { x: 400, width: 95, val: req.assignedToId?.name || 'N/A' },
          { x: 495, width: 100, val: formatDate(req.scheduledDate) },
        ];

        rowData.forEach(({ x, width, val }) => {
          doc.fontSize(8.5).font('Helvetica').fillColor('#111827')
            .text(String(val), x + 2, y + 4, { width, ellipsis: true });
        });

        // Row border
        doc.rect(50, y, 495, rowHeight).stroke('#E5E7EB');
        y += rowHeight;
      });
    }

    // ── Footer ──
    doc.fontSize(8).font('Helvetica').fillColor('#9CA3AF')
      .text(
        `Generated by GearGuard on ${new Date().toLocaleString('en-IN')}`,
        50,
        doc.page.height - 40,
        { align: 'center', width: 495 }
      );

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  exportEquipmentExcel,
  exportRequestsExcel,
  exportEquipmentPDF,
};
