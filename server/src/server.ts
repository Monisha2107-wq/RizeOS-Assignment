import app from './app';
import db from './config/db';
import WebSocketManager from './websocket/WebSocketServer'; 
import './events/handlers/TaskCompletedHandler'; 

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const res = await db.query('SELECT NOW()');
    console.log(`Database time: ${res.rows[0].now}`);

    const server = app.listen(PORT, () => {
      console.log(`RizeOS Server running on http://localhost:${PORT}`);
    });

    WebSocketManager.initialize(server);

  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();