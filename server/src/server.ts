import app from './app';
import db from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const res = await db.query('SELECT NOW()');
    console.log(`Database time: ${res.rows[0].now}`);

    app.listen(PORT, () => {
      console.log(`RizeOS Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();