import * as express from 'express';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends express.Request {
  user: User;
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
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user;
}
