import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  subscriptionTier: string;
}

export class SecurityUtil {
  public static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  public static async comparePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  public static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });
  }

  public static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: 'refresh' }, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });
  }

  public static verifyToken<T = TokenPayload>(token: string): T {
    return jwt.verify(token, config.jwt.secret) as T;
  }
}
