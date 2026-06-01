const { withTransactionFallback } = require('../utils/transaction');
const mongoose = require('mongoose');

describe('Transaction Fallback Utility', () => {
  beforeAll(async () => {
    // Just mock mongoose startSession
    jest.spyOn(mongoose, 'startSession').mockImplementation(() => {
      const error = new Error('Transactions are not supported');
      error.name = 'MongoServerError';
      error.codeName = 'TransactionSupportError';
      throw error;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should fall back to executing callback without session when transactions are not supported', async () => {
    const mockCallback = jest.fn().mockResolvedValue('success');
    
    const result = await withTransactionFallback(mockCallback);
    
    expect(result).toBe('success');
    expect(mockCallback).toHaveBeenCalledWith(undefined);
  });

  it('should throw genuine business errors', async () => {
    const mockCallback = jest.fn().mockRejectedValue(new Error('Business logic failed'));
    
    await expect(withTransactionFallback(mockCallback)).rejects.toThrow('Business logic failed');
  });
});
