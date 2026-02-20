import fs from 'fs';
import path from 'path';
import db from '../config/db';

const runMigrations = async () => {
  try {
    const migrationsDir = path.join(__dirname, '../../migrations');
    
    const files = fs.readdirSync(migrationsDir).sort();

    console.log('Running database migrations...');

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Executing ${file}...`);
        const sqlPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await db.query(sql);
        console.log(`Finished ${file}`);
      }
    }
    
    console.log('All migrations executed successfully! Tables are ready.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();