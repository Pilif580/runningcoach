import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('paceplan.db');

export function initDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Create plans table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS plans (
            id TEXT PRIMARY KEY,
            start_date TEXT,
            coach_note TEXT
          );
        `);

        // Create plan_days table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS plan_days (
            id TEXT PRIMARY KEY,
            plan_id TEXT,
            date TEXT,
            type_name TEXT,
            target_distance_km REAL,
            completed INTEGER DEFAULT 0
          );
        `);

        // Create completions table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS completions (
            id TEXT PRIMARY KEY,
            plan_day_id TEXT,
            completed_distance_km REAL,
            completed_duration_min INTEGER,
            avg_pace_sec_per_km INTEGER
          );
        `);

        // Create mutations_queue table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS mutations_queue (
            id TEXT PRIMARY KEY,
            op TEXT,
            payload TEXT,
            created_at INTEGER
          );
        `);
      },
      (error) => {
        console.error('Database initialization error:', error);
        reject(error);
      },
      () => {
        console.log('Database initialized successfully');
        resolve();
      }
    );
  });
}

