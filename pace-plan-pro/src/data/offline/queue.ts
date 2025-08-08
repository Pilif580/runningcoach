import { db } from './db';
import { supabase } from '../supabase';

export function enqueue(op: string, payload: any): void {
  const id = `${op}_${Date.now()}`;
  const timestamp = Date.now();
  
  db.transaction((tx) => {
    tx.executeSql(
      'INSERT INTO mutations_queue (id, op, payload, created_at) VALUES (?, ?, ?, ?)',
      [id, op, JSON.stringify(payload), timestamp],
      () => {
        console.log(`Enqueued ${op} operation:`, id);
      },
      (_, error) => {
        console.error('Failed to enqueue operation:', error);
        return false;
      }
    );
  });
}

export async function flushQueue(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Read all rows from mutations_queue
        tx.executeSql(
          'SELECT * FROM mutations_queue ORDER BY created_at ASC',
          [],
          async (_, result) => {
            const rows = result.rows._array;
            
            for (const row of rows) {
              try {
                const payload = JSON.parse(row.payload);
                let success = false;

                if (row.op === 'completion') {
                  const { error } = await supabase
                    .from('completions')
                    .insert(payload);
                  
                  if (!error) {
                    success = true;
                  } else {
                    console.error('Failed to sync completion to Supabase:', error);
                  }
                }

                // Delete successfully synced row from queue
                if (success) {
                  tx.executeSql(
                    'DELETE FROM mutations_queue WHERE id = ?',
                    [row.id],
                    () => {
                      console.log(`Successfully synced and removed ${row.op}:`, row.id);
                    },
                    (_, error) => {
                      console.error('Failed to remove synced row from queue:', error);
                      return false;
                    }
                  );
                }
              } catch (error) {
                console.error('Error processing queue row:', row.id, error);
              }
            }
          },
          (_, error) => {
            console.error('Failed to read mutations_queue:', error);
            return false;
          }
        );
      },
      (error) => {
        console.error('Queue flush transaction error:', error);
        reject(error);
      },
      () => {
        console.log('Queue flush completed');
        resolve();
      }
    );
  });
}

