import * as SQLite from 'expo-sqlite';

// Initialize the SQLite database
const db = SQLite.openDatabaseSync('paceplanpro.db');

// Initialize tables
export function initializeDatabase() {
  try {
    // Create offline_queue table for queuing operations when offline
    db.execSync(`
      CREATE TABLE IF NOT EXISTS offline_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        op TEXT NOT NULL,
        table_name TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Queue operations for offline sync
export function queueOperation(op: 'INSERT' | 'DELETE' | 'UPDATE', tableName: string, payload: object) {
  try {
    const statement = db.prepareSync(`
      INSERT INTO offline_queue (op, table_name, payload)
      VALUES (?, ?, ?)
    `);
    
    statement.executeSync([op, tableName, JSON.stringify(payload)]);
    statement.finalizeSync();
    
    console.log(`Queued ${op} operation for ${tableName}`);
  } catch (error) {
    console.error('Error queuing operation:', error);
  }
}

// Get all queued operations
export function getQueuedOperations(): Array<{
  id: number;
  op: string;
  table_name: string;
  payload: any;
  created_at: string;
}> {
  try {
    const statement = db.prepareSync(`
      SELECT * FROM offline_queue ORDER BY created_at ASC
    `);
    
    const result = statement.executeSync();
    const operations = result.getAllSync();
    statement.finalizeSync();
    
    return operations.map((op: any) => ({
      id: op.id as number,
      op: op.op as string,
      table_name: op.table_name as string,
      payload: JSON.parse(op.payload as string),
      created_at: op.created_at as string
    }));
  } catch (error) {
    console.error('Error getting queued operations:', error);
    return [];
  }
}

// Remove queued operation after successful sync
export function removeQueuedOperation(id: number) {
  try {
    const statement = db.prepareSync(`
      DELETE FROM offline_queue WHERE id = ?
    `);
    
    statement.executeSync([id]);
    statement.finalizeSync();
    
    console.log(`Removed queued operation with id: ${id}`);
  } catch (error) {
    console.error('Error removing queued operation:', error);
  }
}

// Clear all queued operations (useful for debugging)
export function clearQueue() {
  try {
    db.execSync('DELETE FROM offline_queue');
    console.log('Queue cleared successfully');
  } catch (error) {
    console.error('Error clearing queue:', error);
  }
}

export default db;
