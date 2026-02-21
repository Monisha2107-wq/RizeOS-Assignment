import EventBus, { EventName } from '../EventBus';
import ScoringEngine from '../../services/ai/ScoringEngine';
import Web3Logger from '../../services/web3/Web3Logger';

export class TaskCompletedHandler {
  constructor() {}

  public async handle(payload: { taskId: string; orgId: string; employeeId: string }) {
    console.log(`[EventHandler] Reacting to TASK_COMPLETED for Task ID: ${payload.taskId}`);
    
    try {
      await ScoringEngine.recomputeScore(payload.employeeId, payload.orgId);
    
      Web3Logger.logTaskCompletion(payload.taskId, payload.employeeId, payload.orgId)
        .catch(err => console.error("Web3 Background Error:", err));
      
    } catch (error) {
      console.error(`[EventHandler] Error processing TASK_COMPLETED event:`, error);
    }
  }
}

export default new TaskCompletedHandler();