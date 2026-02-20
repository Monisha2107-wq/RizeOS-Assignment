import TaskRepository from '../repositories/TaskRepository';
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

  public async getOrgTasks(orgId: string): Promise<ITask[]> {
    return await TaskRepository.findAllByOrg(orgId);
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
}

export default new TaskService();