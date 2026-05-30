const { calculateNextRun, processDueSchedules } = require('../cron/preventiveSchedulerCron');
const { PreventiveSchedule, MaintenanceRequest, Equipment } = require('../models');
const generateRequestNumber = require('../utils/generateRequestNumber');

jest.mock('../models', () => ({
  PreventiveSchedule: {
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
  MaintenanceRequest: {
    create: jest.fn(),
    findById: jest.fn()
  },
  Equipment: {
    findByIdAndUpdate: jest.fn()
  }
}));

jest.mock('../utils/generateRequestNumber');
jest.mock('../utils/logActivity', () => ({ logActivity: jest.fn() }));
jest.mock('../services/notificationService', () => ({
  notifyRequestChange: jest.fn(),
  sendEmail: jest.fn(),
  createAndEmit: jest.fn(),
  EMAIL_SUBJECTS: { ASSIGNED: 'assigned' },
  assignmentTemplate: jest.fn()
}));

describe('Preventive Scheduler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateNextRun', () => {
    it('should calculate next run for daily frequency', () => {
      const nextRun = calculateNextRun({ frequency: 'daily' });
      const now = new Date();
      now.setDate(now.getDate() + 1);
      expect(nextRun.getDate()).toBe(now.getDate());
    });

    it('should calculate next run for weekly frequency', () => {
      const nextRun = calculateNextRun({ frequency: 'weekly' });
      const now = new Date();
      now.setDate(now.getDate() + 7);
      expect(nextRun.getDate()).toBe(now.getDate());
    });

    it('should calculate next run for monthly frequency', () => {
      const nextRun = calculateNextRun({ frequency: 'monthly' });
      const now = new Date();
      now.setMonth(now.getMonth() + 1);
      expect(nextRun.getMonth()).toBe(now.getMonth());
    });

    it('should calculate next run for custom frequency', () => {
      const nextRun = calculateNextRun({ frequency: 'custom', intervalDays: 10 });
      const now = new Date();
      now.setDate(now.getDate() + 10);
      expect(nextRun.getDate()).toBe(now.getDate());
    });
  });

  describe('processDueSchedules Idempotency', () => {
    it('should NOT create request if schedule is already claimed (findOneAndUpdate returns null)', async () => {
      PreventiveSchedule.find.mockResolvedValue([
        { _id: '1', frequency: 'daily', nextRunAt: new Date() }
      ]);
      
      // Simulate another worker claimed it
      PreventiveSchedule.findOneAndUpdate.mockResolvedValue(null);

      await processDueSchedules(null);

      expect(PreventiveSchedule.findOneAndUpdate).toHaveBeenCalled();
      expect(generateRequestNumber).not.toHaveBeenCalled();
      expect(MaintenanceRequest.create).not.toHaveBeenCalled();
    });

    it('should create request if schedule is successfully claimed', async () => {
      const mockSchedule = {
        _id: '1',
        frequency: 'daily',
        nextRunAt: new Date(),
        subject: 'Test Maintenance',
        equipmentId: 'eq1'
      };

      PreventiveSchedule.find.mockResolvedValue([mockSchedule]);
      
      // Successfully claimed
      PreventiveSchedule.findOneAndUpdate.mockResolvedValue({ ...mockSchedule, nextRunAt: new Date() });
      generateRequestNumber.mockResolvedValue('REQ-202605-0001');
      MaintenanceRequest.create.mockResolvedValue({ _id: 'req1' });
      const chainableMock = {
        populate: jest.fn().mockReturnThis(),
        then: jest.fn(resolve => resolve({ _id: 'req1', subject: 'Test Maintenance', assignedTo: { email: 'test@test.com' } }))
      };
      MaintenanceRequest.findById.mockReturnValue(chainableMock);

      await processDueSchedules(null);

      expect(PreventiveSchedule.findOneAndUpdate).toHaveBeenCalled();
      expect(generateRequestNumber).toHaveBeenCalled();
      expect(MaintenanceRequest.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'preventive',
        subject: 'Test Maintenance',
        equipmentId: 'eq1'
      }));
    });
  });
});
