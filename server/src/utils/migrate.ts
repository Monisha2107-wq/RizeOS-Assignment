import fs from 'fs';
import path from 'path';
import db from '../config/db';

const runMigrations = async () => {
  try {
    const sqlPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running database migrations...');
    await db.query(sql);
    console.log('Migrations executed successfully! Tables are ready.');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();