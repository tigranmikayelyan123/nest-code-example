import { TasksRepository } from './tasks.repository';
import { GetTasksFilterDto } from './dtos/get-taks-filter.dto';
import { CreateTaskDto } from './dtos/create-task.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';
import { User } from '../auth/user.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class TasksService {
  private logger = new Logger('TasksService');

  constructor(private tasksRepository: TasksRepository) {}

  getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    return this.tasksRepository.getTasks(filterDto, user);
  }

  async getTaskById(id: string, user: User): Promise<Task> {
    const found = await this.tasksRepository.findOne({
      where: {
        id,
        user,
      },
    });

    if (!found) {
      throw new NotFoundException(`The task with ${id} not found`);
    }
    return found;
  }

  createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    return this.tasksRepository.createTask(createTaskDto, user);
  }

  async deleteTask(id: string, user: User): Promise<void> {
    const result = await this.tasksRepository.delete({ id, user });

    if (!result.affected) {
      throw new NotFoundException(`The task with ${id} not found`);
    }
  }
  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    const task = await this.getTaskById(id, user);
    this.logger.verbose(
      `User ${user.username} is trying to change the taskStatus from ${task.status} to ${status}`,
    );

    task.status = status;
    await this.tasksRepository.save(task);
    return task;
  }
}
