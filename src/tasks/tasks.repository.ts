import { CreateTaskDto } from './dtos/create-task.dto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Task } from './task.entity';
import { Repository, DataSource } from 'typeorm';
import { TaskStatus } from './task-status.enum';
import { GetTasksFilterDto } from './dtos/get-taks-filter.dto';
import { User } from '../auth/user.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class TasksRepository extends Repository<Task> {
  private logger = new Logger('TasksRepository');
  constructor(private datasource: DataSource) {
    super(Task, datasource.createEntityManager());
  }

  async createTask(createTaskDto: CreateTaskDto, user: User) {
    const { title, description } = createTaskDto;

    const task = this.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user,
    });

    await this.save(task);

    return task;
  }

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, search } = filterDto;

    const query = this.createQueryBuilder('task');

    query.where({ user });

    if (status) {
      query.andWhere('task.status = :status', {
        status,
      });
    }

    if (search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    try {
      const tasks = await query.getMany();
      return tasks;
    } catch (error) {
      this.logger.error(
        `User ${
          user.username
        } couldn't get the tasks for some reason. Filters: ${JSON.stringify(
          filterDto,
        )} See the stack trace bellow `,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
