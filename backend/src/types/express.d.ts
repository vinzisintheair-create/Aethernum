export {};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      currentSpaceId?: string;
      userRoleInSpace?: 'ADMIN' | 'MEMBER';
    }
  }
}
