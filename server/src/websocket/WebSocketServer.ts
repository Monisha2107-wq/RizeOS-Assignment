import { WebSocket, WebSocketServer as WSServer } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import EventBus, { EventName } from '../events/EventBus';

export class WebSocketManager {
  private wss!: WSServer;
  
  private orgRooms: Map<string, Set<WebSocket>> = new Map();
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

  public initialize(server: Server) {
    this.wss = new WSServer({ server });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    this.setupEventListeners();
    
    console.log('[WebSocket] Server initialized and ready for connections.');
  }

  private handleConnection(ws: WebSocket, req: any) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Unauthorized: No token provided');
      return;
    }

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { sub: string, orgId: string };
      const orgId = decoded.orgId;

      if (!this.orgRooms.has(orgId)) {
        this.orgRooms.set(orgId, new Set());
      }
      this.orgRooms.get(orgId)!.add(ws);

      console.log(`[WebSocket] Client connected to Org Room: ${orgId}`);

      ws.on('close', () => {
        this.orgRooms.get(orgId)?.delete(ws);
        if (this.orgRooms.get(orgId)?.size === 0) {
          this.orgRooms.delete(orgId); 
        }
        console.log(`[WebSocket] Client disconnected from Org Room: ${orgId}`);
      });

    } catch (error) {
      ws.close(4003, 'Unauthorized: Invalid token');
    }
  }

  public broadcastToOrg(orgId: string, eventName: string, payload: any) {
    const room = this.orgRooms.get(orgId);
    if (!room) return;

    const message = JSON.stringify({ event: eventName, data: payload });
    room.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private setupEventListeners() {
    EventBus.on(EventName.TASK_COMPLETED, (payload) => {
      this.broadcastToOrg(payload.orgId, 'dashboard.task_completed', payload);
    });
    
    EventBus.on(EventName.TASK_CREATED, (payload) => {
      this.broadcastToOrg(payload.orgId, 'dashboard.task_created', payload);
    });
  }
}

export default new WebSocketManager();