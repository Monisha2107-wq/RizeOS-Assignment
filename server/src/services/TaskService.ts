import TaskRepository, { ITaskQueryParams } from '../repositories/TaskRepository';
import { ITask, IWeeklyTaskStat } from '../interfaces/task.interface';
import EventBus, { EventName } from '../events/EventBus';

export class TaskService {
  
  public async createTask(orgId: string, createdBy: string, taskData: any): Promise<ITask> {
    const newTask: ITask = {
      org_id: orgId,
      created_by: createdBy,
      assigned_to: taskData.assigned_to, 
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      required_skills: JSON.stringify(taskData.required_skills || [])
    };

    return await TaskRepository.create(newTask);
  }

  public async getOrgTasks(orgId: string, params: ITaskQueryParams): Promise<{ data: ITask[], total: number }> {
    return await TaskRepository.findAllByOrg(orgId, params);
  }

  public async updateTaskStatus(taskId: string, orgId: string, status: string): Promise<ITask> {
    const updatedTask = await TaskRepository.updateStatus(taskId, orgId, status);
    
    if (!updatedTask) {
      throw new Error('Task not found or you do not have permission to update it.');
    }

    if (status === 'completed' && updatedTask.assigned_to) {
      EventBus.publish(EventName.TASK_COMPLETED, {
        taskId: updatedTask.id,
        orgId: updatedTask.org_id,
        employeeId: updatedTask.assigned_to
      });
    }

    return updatedTask;
  }

  public async updateTask(taskId: string, orgId: string, updates: Partial<ITask>): Promise<ITask> {
    if (updates.required_skills && Array.isArray(updates.required_skills)) {
      updates.required_skills = JSON.stringify(updates.required_skills) as any;
    }

    const updatedTask = await TaskRepository.update(taskId, orgId, updates);
    if (!updatedTask) {
      throw new Error('Task not found or you do not have permission to update it.');
    }
    
    return updatedTask;
  }

  public async deleteTask(taskId: string, orgId: string): Promise<void> {
    const isDeleted = await TaskRepository.delete(taskId, orgId);
    if (!isDeleted) {
      throw new Error('Task not found or you do not have permission to delete it.');
    }
  }

  public async getWeeklyTaskStats(orgId: string) : Promise<IWeeklyTaskStat[]> {
    const rawStats = await TaskRepository.getWeeklyStats(orgId);
    
    const statsMap = rawStats.reduce((acc, curr) => {
      acc[curr.date] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    const chartData: IWeeklyTaskStat[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const dateStr = d.toISOString().split('T')[0]; 
      const dayName = days[d.getDay()];

      chartData.push({
        name: dayName,
        tasks: statsMap[dateStr] || 0 
      });
    }

    return chartData;
  }
}

export default new TaskService();