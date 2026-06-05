import * as express from 'express';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Express.Request {
  user: User;
}

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[],
): Promise<any> {
  if (securityName === 'jwt') {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

  throw new Error('Unsupported security method');
}
