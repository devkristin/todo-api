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
  Tags,
  SuccessResponse,
} from 'tsoa';
import { AuthenticatedRequest } from '../../auth';
import { SupabaseClient } from '@supabase/supabase-js';

export interface CreateRoutineRequest {
  title: string;
  description?: string;
  is_active?: boolean;
}

export interface RoutineResponse {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateBlueprintRequest {
  title: string;
  is_priority?: boolean;
  position?: number;
  schedule_time?: string | null;
}

export interface BlueprintResponse {
  id: string;
  routine_id: string;
  title: string;
  is_priority: boolean;
  position: number;
  schedule_time: string | null;
}

const DEFAULT_START_POSITION = 1.0;

@Route('routines')
@Tags('Routines')
@Security('jwt')
export class RoutinesController extends Controller {
  private calculateBlueprintPosition(
    abovePosition: number | null,
    belowPosition: number | null,
  ): number {
    if (abovePosition !== null && belowPosition !== null) {
      return (abovePosition + belowPosition) / 2;
    } else if (abovePosition !== null) {
      return abovePosition + 1.0;
    } else if (belowPosition !== null) {
      return belowPosition / 2;
    } else {
      return DEFAULT_START_POSITION;
    }
  }

  private async getNextBlueprintAppendPosition(
    routineId: string,
    userId: string,
    supabase: SupabaseClient,
  ): Promise<number> {
    const { data, error } = await supabase
      .from('routine_todo_blueprint')
      .select('position')
      .eq('routine_id', routineId)
      .eq('user_id', userId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? data.position + 1.0 : DEFAULT_START_POSITION;
  }

  @Get('')
  public async getRoutines(@Request() request: AuthenticatedRequest): Promise<RoutineResponse[]> {
    const { data, error } = await request.supabase
      .from('routine')
      .select('*')
      .eq('user_id', request.user.id);
    if (error) throw new Error(error.message);
    return data;
  }

  @Post('')
  @SuccessResponse('201', 'Created')
  public async createRoutine(
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateRoutineRequest,
  ): Promise<RoutineResponse> {
    const { data, error } = await request.supabase
      .from('routine')
      .insert([{ ...body, user_id: request.user.id }])
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  @Put('{id}')
  public async updateRoutine(
    @Path() id: string,
    @Request() request: AuthenticatedRequest,
    @Body() body: Partial<CreateRoutineRequest>,
  ): Promise<RoutineResponse> {
    const { data, error } = await request.supabase
      .from('routine')
      .update(body)
      .eq('id', id)
      .eq('user_id', request.user.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  @Delete('{id}')
  @SuccessResponse('204', 'No Content')
  public async deleteRoutine(
    @Path() id: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<void> {
    const { error } = await request.supabase
      .from('routine')
      .delete()
      .eq('id', id)
      .eq('user_id', request.user.id);
    if (error) throw new Error(error.message);
  }

  @Get('{routineId}/blueprints')
  public async getBlueprints(
    @Path() routineId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<BlueprintResponse[]> {
    const { data, error } = await request.supabase
      .from('routine_todo_blueprint')
      .select('*')
      .eq('routine_id', routineId);
    if (error) throw new Error(error.message);
    return data;
  }

  @Post('{routineId}/blueprints')
  @SuccessResponse('201', 'Created')
  public async createBlueprint(
    @Path() routineId: string,
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateBlueprintRequest,
  ): Promise<BlueprintResponse> {
    const nextPosition = await this.getNextBlueprintAppendPosition(
      routineId,
      request.user.id,
      request.supabase,
    );

    const newBlueprint = {
      ...body,
      routine_id: routineId,
      user_id: request.user.id,
      position: nextPosition,
      schedule_time: body.schedule_time || null,
    };

    const { data, error } = await request.supabase
      .from('routine_todo_blueprint')
      .insert([newBlueprint])
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  @Put('blueprints/{blueprintId}')
  public async updateBlueprint(
    @Path() blueprintId: string,
    @Request() request: AuthenticatedRequest,
    @Body() body: Partial<CreateBlueprintRequest>,
  ): Promise<BlueprintResponse> {
    const { data, error } = await request.supabase
      .from('routine_todo_blueprint')
      .update(body)
      .eq('user_id', request.user.id)
      .eq('id', blueprintId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  @Delete('blueprints/{blueprintId}')
  @SuccessResponse('204', 'No Content')
  public async deleteBlueprint(
    @Path() blueprintId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<void> {
    const { error } = await request.supabase
      .from('routine_todo_blueprint')
      .delete()
      .eq('id', blueprintId)
      .eq('user_id', request.user.id);
    if (error) throw new Error(error.message);
  }
}
