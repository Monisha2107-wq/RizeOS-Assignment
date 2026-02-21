import { EventEmitter } from 'events';

export enum EventName {
  TASK_CREATED = 'task.created',
  TASK_COMPLETED = 'task.completed',
  EMPLOYEE_ADDED = 'employee.added'
}

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(20); 
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  public publish(eventName: EventName, payload: any): void {
    console.log(`[EventBus] Emitting event: ${eventName}`);
    this.emit(eventName, payload);
  }

  public subscribe(eventName: EventName, handler: (payload: any) => void): void {
    console.log(`[EventBus] New subscriber for: ${eventName}`);
    this.on(eventName, handler);
  }
}

export default EventBus.getInstance();