import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Security,
  Request,
  Body,
  Path,
  Query,
  SuccessResponse,
  Response,
  Tags,
} from 'tsoa';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../../auth';

export interface CreateTodoRequest {
  schedule_date: string; // YYYY-MM-DD
  schedule_time?: string; // HH:MM:SS
  title: string;
  is_priority?: boolean;
  is_follow_up?: boolean;
}

export interface UpdateTodoRequest {
  todo: Partial<{
    title?: string;
    schedule_date?: string;
    schedule_time?: string | null;
    is_priority?: boolean;
    is_follow_up?: boolean;
    is_completed?: boolean;
  }>;
  position_change?: MoveTodoPositionRequest;
}

export interface MoveTodoPositionRequest {
  aboveTodoPosition: number | null;
  belowTodoPosition: number | null;
}

export interface TodoResponse {
  id: string;
  user_id: string;
  schedule_date: string;
  schedule_time: string | null;
  title: string;
  is_priority: boolean;
  is_follow_up: boolean;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TodoErrorResponse {
  error: string;
}

const DEFAULT_START_POSITION = 1.0;

@Route('todos')
@Tags('Todos')
@Security('jwt')
@Response<TodoErrorResponse>(400, 'Bad Request')
@Response<TodoErrorResponse>(401, 'Unauthorized')
export class TodosController extends Controller {
  /**
   * Helper function to calculate a moved todo's target position using floating-point fractional indexing
   * e.g. when a todo is dragged into a different position in a list
   */
  private calculateTodoPosition(
    aboveTodoPosition: number | null,
    belowTodoPosition: number | null,
  ): number {
    if (aboveTodoPosition !== null && belowTodoPosition !== null) {
      return (aboveTodoPosition + belowTodoPosition) / 2;
    } else if (aboveTodoPosition !== null) {
      return aboveTodoPosition + 1.0;
    } else if (belowTodoPosition !== null) {
      return belowTodoPosition / 2;
    } else {
      return DEFAULT_START_POSITION;
    }
  }

  /**
   * Helper function to find the next append position depending on the todos type
   * e.g. when a todo gets added to the end of a list
   */
  private async getNextAppendPosition(
    userId: string,
    isFollowUp: boolean,
    isPriority: boolean,
    scheduleDate: string,
    supabase: SupabaseClient,
  ): Promise<number> {
    let query = supabase.from('todo').select('position').eq('user_id', userId);

    if (isFollowUp) {
      // Follow Up
      query = query.eq('is_follow_up', true);
    } else {
      // Dated todo based on priority
      query = query
        .eq('is_follow_up', false)
        .eq('schedule_date', scheduleDate)
        .eq('is_priority', isPriority);
    }

    const { data, error } = await query
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data ? data.position + 1.0 : DEFAULT_START_POSITION;
  }

  /**
   * Fetch todos belonging to the authenticated user with optional filters
   */
  @Get('')
  public async getTodos(
    @Request() request: AuthenticatedRequest,
    @Query() date?: string,
    @Query() isPriority?: boolean,
    @Query() isFollowUp?: boolean,
  ): Promise<TodoResponse[]> {
    let query = request.supabase.from('todo').select('*').eq('user_id', request.user.id);

    if (date) query = query.eq('schedule_date', date);
    if (isPriority !== undefined) query = query.eq('is_priority', isPriority);
    if (isFollowUp !== undefined) query = query.eq('is_follow_up', isFollowUp);

    const { data, error } = await query.order('position', { ascending: true });

    if (error) {
      this.setStatus(400);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Fetch all scheduled todos for a given date with an assigned timestamp
   */
  @Get('schedule')
  public async getScheduledTodos(
    @Request() request: AuthenticatedRequest,
    @Query() date: string,
  ): Promise<TodoResponse[]> {
    const { data, error } = await request.supabase
      .from('todo')
      .select('*')
      .eq('user_id', request.user.id)
      .eq('schedule_date', date)
      .not('schedule_time', 'is', null)
      .order('schedule_time', { ascending: true });

    if (error) {
      this.setStatus(400);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Create a new todo item at the bottom of its respective list
   */
  @Post('')
  @SuccessResponse('201', 'Created')
  public async createTodo(
    @Request() request: AuthenticatedRequest,
    @Body() requestBody: CreateTodoRequest,
  ): Promise<TodoResponse> {
    const isFollowUp = requestBody.is_follow_up ?? false;
    const isPriority = requestBody.is_priority ?? false;
    const scheduleDate = requestBody.schedule_date;

    let nextPosition: number;
    try {
      nextPosition = await this.getNextAppendPosition(
        request.user.id,
        isFollowUp,
        isPriority,
        scheduleDate,
        request.supabase,
      );
    } catch (err: any) {
      this.setStatus(400);
      throw new Error(err.message);
    }

    const newTodo = {
      user_id: request.user.id,
      schedule_date: scheduleDate,
      schedule_time: requestBody.schedule_time || null,
      title: requestBody.title,
      is_priority: isPriority,
      is_follow_up: isFollowUp,
      position: nextPosition,
    };

    const { data, error } = await request.supabase
      .from('todo')
      .insert([newTodo])
      .select('*')
      .single();

    if (error) {
      this.setStatus(400);
      throw new Error(error.message);
    }

    this.setStatus(201);
    return data;
  }

  /**
   * Update a specific todo item and determine its target position when applicable
   * If its position changes (e.g. a todo has been dragged and dropped) calculate the position based on the todo before and after it
   * If only its list group context changes (e.g. a todo has been marked as priority) add it to the end of the new list
   * Then update the changed details of the todo
   */
  @Put('{id}')
  @Response<TodoErrorResponse>(404, 'Not Found')
  public async updateTodo(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
    @Body() requestBody: UpdateTodoRequest,
  ): Promise<TodoResponse> {
    const { data: currentTodo, error: fetchError } = await request.supabase
      .from('todo')
      .select('*')
      .eq('id', id)
      .eq('user_id', request.user.id)
      .single();

    if (fetchError || !currentTodo) {
      this.setStatus(fetchError ? 400 : 404);
      throw new Error(fetchError ? fetchError.message : 'Todo item not found');
    }

    const updates: Partial<TodoResponse> = { ...requestBody.todo };

    const positionChange = requestBody.position_change;

    const isChangingFollowUp =
      requestBody.todo.is_follow_up !== undefined &&
      requestBody.todo.is_follow_up !== currentTodo.is_follow_up;
    const isChangingPriority =
      requestBody.todo.is_priority !== undefined &&
      requestBody.todo.is_priority !== currentTodo.is_priority;
    const isChangingDates =
      requestBody.todo.schedule_date !== undefined &&
      requestBody.todo.schedule_date !== currentTodo.schedule_date;

    const contextChange = isChangingFollowUp || isChangingPriority || isChangingDates;

    if (positionChange) {
      const { aboveTodoPosition, belowTodoPosition } = positionChange;
      const targetPosition = this.calculateTodoPosition(aboveTodoPosition, belowTodoPosition);
      updates.position = targetPosition;
    } else if (contextChange) {
      try {
        const targetFollowUp = requestBody.todo.is_follow_up ?? currentTodo.is_follow_up;
        const targetPriority = requestBody.todo.is_priority ?? currentTodo.is_priority;
        const targetDate = requestBody.todo.schedule_date ?? currentTodo.schedule_date;

        updates.position = await this.getNextAppendPosition(
          request.user.id,
          targetFollowUp,
          targetPriority,
          targetDate,
          request.supabase,
        );
      } catch (err: any) {
        this.setStatus(400);
        throw new Error(err.message);
      }
    }

    const { data, error } = await request.supabase
      .from('todo')
      .update(updates)
      .eq('id', id)
      .eq('user_id', request.user.id)
      .select('*')
      .single();

    if (error) {
      this.setStatus(400);
      throw new Error(error.message);
    }

    if (!data) {
      this.setStatus(404);
      throw new Error('Update failed: Item not found or unauthorized');
    }

    return data;
  }

  /**
   * Update a todo's position using floating-point fractional indexing inside its current group
   */
  @Put('{id}/position')
  @SuccessResponse('200', 'OK')
  @Response<TodoErrorResponse>(404, 'Not Found')
  public async moveTodoPosition(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
    @Body() requestBody: MoveTodoPositionRequest,
  ): Promise<TodoResponse> {
    const { aboveTodoPosition, belowTodoPosition } = requestBody;
    const targetPosition = this.calculateTodoPosition(aboveTodoPosition, belowTodoPosition);

    const { data, error } = await request.supabase
      .from('todo')
      .update({ position: targetPosition })
      .eq('id', id)
      .eq('user_id', request.user.id)
      .select('*')
      .single();

    if (error) {
      this.setStatus(400);
      throw new Error(error.message);
    }

    if (!data) {
      this.setStatus(404);
      throw new Error('Todo item not found or unauthorized');
    }

    return data;
  }

  /**
   * Delete a specific todo item by ID
   */
  @Delete('{id}')
  @SuccessResponse('204', 'No Content')
  @Response<TodoErrorResponse>(404, 'Not Found')
  public async deleteTodo(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
  ): Promise<void> {
    const { error, count } = await request.supabase
      .from('todo')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', request.user.id);

    if (error) {
      this.setStatus(400);
      throw new Error(error.message);
    }

    if (count === 0) {
      this.setStatus(404);
      throw new Error('Todo item not found or unauthorized');
    }

    this.setStatus(204);
    return;
  }
}
