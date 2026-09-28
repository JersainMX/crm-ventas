import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (payload) => {
  return jwt.sign(payload, env.JWT.secret, {
    expiresIn: env.JWT.expires,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT.secret);
};