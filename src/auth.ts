import * as express from 'express';
import { supabaseAdmin, createSupabaseClient } from './supabase';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends express.Request {
  user: User;
  supabase: SupabaseClient;
}

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  _scopes?: string[],
): Promise<User> {
  if (securityName !== 'jwt') {
    throw new Error('Unsupported security method');
  }

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.split(' ')[1];

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = user;
  authenticatedRequest.supabase = createSupabaseClient(token);

  return user;
}
