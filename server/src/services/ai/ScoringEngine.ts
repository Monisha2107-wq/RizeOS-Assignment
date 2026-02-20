import TaskRepository from '../../repositories/TaskRepository';
import db from '../../config/db';

export class ScoringEngine {
  public async recomputeScore(employeeId: string, orgId: string): Promise<void> {
    console.log(`[ScoringEngine] Analyzing workforce data for employee: ${employeeId}`);
    
    const tasks = await TaskRepository.findAllByEmployee(employeeId);
    
    if (tasks.length === 0) return;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = completedTasks.length / totalTasks;

    let priorityScore = 0;
    completedTasks.forEach(t => {
      if (t.priority === 'high') priorityScore += 1.5;
      else if (t.priority === 'medium') priorityScore += 1.0;
      else priorityScore += 0.7;
    });
    const normalizedPriorityWeight = completedTasks.length > 0 ? priorityScore / completedTasks.length : 0;
    
    const priorityCap = Math.min(normalizedPriorityWeight, 1.0);

    const baseScore = (completionRate * 0.40) + (priorityCap * 0.60);
    const finalScore = Math.round(baseScore * 100);

    const trend = finalScore >= 80 ? 'up' : 'stable';

    const breakdownData = {
      total_assigned: totalTasks,
      total_completed: completedTasks.length,
      completion_rate_pct: Math.round(completionRate * 100)
    };

    const query = `
      INSERT INTO ai_scores (org_id, employee_id, productivity_score, task_completion_rate, trend, score_breakdown, computed_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (employee_id) 
      DO UPDATE SET 
        productivity_score = EXCLUDED.productivity_score,
        task_completion_rate = EXCLUDED.task_completion_rate,
        trend = EXCLUDED.trend,
        score_breakdown = EXCLUDED.score_breakdown,
        computed_at = CURRENT_TIMESTAMP;
    `;

    await db.query(query, [
      orgId, 
      employeeId, 
      finalScore, 
      completionRate, 
      trend, 
      JSON.stringify(breakdownData)
    ]);

    console.log(`[ScoringEngine] Score updated for ${employeeId}: ${finalScore}/100`);
  }
}

export default new ScoringEngine();