import { Body, Controller, Post, Route, SuccessResponse, Request, Response, Tags } from 'tsoa';
import { supabaseAuth as supabase } from '../../supabase';
import express from 'express';

export interface AuthRequest {
  email: string;
  password: string;
}

export interface SwaggerOAuth2Request {
  username?: string;
  password?: string;
}

export interface AuthSuccessResponse {
  message: string;
  user: unknown | null;
  session: unknown | null;
  access_token?: string;
}

export interface ErrorResponse {
  error: string;
}

@Route('auth')
@Tags('Auth')
export class AuthController extends Controller {
  @Post('register')
  @SuccessResponse('201', 'Created')
  @Response<ErrorResponse>(400, 'Bad Request')
  public async register(@Body() requestBody: AuthRequest): Promise<AuthSuccessResponse> {
    const { email, password } = requestBody;

    if (!email || !password) {
      this.setStatus(400);
      throw new Error('Email and password are required');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      this.setStatus(400);
      throw new Error(error.message);
    }

    this.setStatus(201);
    return {
      message: 'Registration successful',
      user: data.user,
      session: data.session,
    };
  }

  @Post('login')
  @SuccessResponse('200', 'OK')
  @Response<ErrorResponse>(400, 'Bad Request')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async login(@Request() request: express.Request): Promise<AuthSuccessResponse> {
    const body = request.body as AuthRequest & SwaggerOAuth2Request;

    const email = body?.email || body?.username;
    const password = body?.password;

    if (!email || !password) {
      this.setStatus(400);
      throw new Error('Email and password are required');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      this.setStatus(401);
      throw new Error(error.message);
    }

    return {
      message: 'Login successful',
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
    };
  }
}
