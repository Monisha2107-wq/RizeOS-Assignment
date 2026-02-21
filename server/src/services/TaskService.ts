import TaskRepository, { ITaskQueryParams } from '../repositories/TaskRepository';
import { ITask } from '../interfaces/task.interface';
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

  // 🚀 UPGRADED: Now accepts parameters and returns the total count
  public async getOrgTasks(orgId: string, params: ITaskQueryParams): Promise<{ data: ITask[], total: number }> {
    return await TaskRepository.findAllByOrg(orgId, params);
  }

  public async updateTaskStatus(taskId: string, orgId: string, status: string): Promise<ITask> {
    const updatedTask = await TaskRepository.updateStatus(taskId, orgId, status);
    
    if (!updatedTask) {
      throw new Error('Task not found or you do not have permission to update it.');
    }

    if (status === 'completed' && updatedTask.assigned_to) {
      // Background Event processing
      EventBus.publish(EventName.TASK_COMPLETED, {
        taskId: updatedTask.id,
        orgId: updatedTask.org_id,
        employeeId: updatedTask.assigned_to
      });
    }

    return updatedTask;
  }

  // 🚀 NEW: Full Task Edit
  public async updateTask(taskId: string, orgId: string, updates: Partial<ITask>): Promise<ITask> {
    // If skills are provided as an array, stringify them for the database
    if (updates.required_skills && Array.isArray(updates.required_skills)) {
      updates.required_skills = JSON.stringify(updates.required_skills) as any;
    }

    const updatedTask = await TaskRepository.update(taskId, orgId, updates);
    if (!updatedTask) {
      throw new Error('Task not found or you do not have permission to update it.');
    }
    
    return updatedTask;
  }

  // 🚀 NEW: Task Deletion
  public async deleteTask(taskId: string, orgId: string): Promise<void> {
    const isDeleted = await TaskRepository.delete(taskId, orgId);
    if (!isDeleted) {
      throw new Error('Task not found or you do not have permission to delete it.');
    }
  }
}

export default new TaskService();