import app from './app';
import db from './config/db';
import WebSocketManager from './websocket/WebSocketServer'; 
import './events/handlers/TaskCompletedHandler'; 

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const res = await db.query('SELECT NOW()');
    console.log(`Database connected. Server time: ${res.rows[0].now}`);

    const server = app.listen(PORT, () => {
      console.log(`RizeOS Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    WebSocketManager.initialize(server);

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await db.end();
          console.log('Database connections closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during database disconnection', err);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('Forcing shutdown due to timeout...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();