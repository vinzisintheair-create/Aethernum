import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'aeternum_fallback_secret_key_change_me_in_production';

interface TokenPayload {
  userId: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.aeternum_session;

    if (!token) {
      return res.status(401).json({ error: 'Authentication token missing.' });
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    // Verify session status in database
    const session = await prisma.serverSession.findUnique({
      where: { token },
    });

    if (!session) {
      return res.status(401).json({ error: 'Session has been invalidated or logged out.' });
    }

    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await prisma.serverSession.delete({ where: { token } }).catch(() => {});
      res.clearCookie('aeternum_session');
      return res.status(401).json({ error: 'Session has expired.' });
    }

    // Attach decoded user ID to Request
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};
