const mongoose = require('mongoose');

/**
 * Wraps a set of database operations in a MongoDB transaction.
 * If the MongoDB instance does not support transactions (e.g., standalone without replica set),
 * it falls back to executing the callback without a transaction.
 * 
 * @param {Function} callback - An async function containing the database operations. Receives a session object.
 * @returns The result of the callback
 */
async function withTransactionFallback(callback) {
  // If we are in a testing environment that doesn't support transactions (like basic MongoMemoryServer without replSet),
  // or local dev without replSet, we catch the TransactionSupportError.
  
  let session = null;
  try {
    session = await mongoose.startSession();
    let result;
    
    // We try to use the transaction
    await session.withTransaction(async (s) => {
      result = await callback(s);
    });
    
    return result;
  } catch (error) {
    if (
      (error.name === 'MongoServerError' && error.codeName === 'TransactionSupportError') ||
      error.message.includes('Transactions are not supported') ||
      error.message.includes('replica set')
    ) {
      console.warn("MongoDB Transactions are not supported by this cluster. Executing non-transactionally as a fallback.");
      // Execute the callback without a session
      return await callback(undefined);
    }
    
    // Re-throw if it's a real business logic or database error
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

module.exports = { withTransactionFallback };
