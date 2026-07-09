import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'aeternum_fallback_secret_key_change_me_in_production';
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const register = async (req: Request, res: Response) => {
  return res.status(403).json({
    error: 'Public registration is disabled. You must be invited by a Friend Space Administrator.'
  });
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find member
    const member = await prisma.member.findUnique({
      where: { email: normalizedEmail }
    });

    if (!member) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, member.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: member.id }, JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

    // Persist session to database
    await prisma.serverSession.create({
      data: {
        userId: member.id,
        token,
        expiresAt
      }
    });

    // Set cookie
    res.cookie('aeternum_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt
    });

    return res.status(200).json({
      message: 'Logged in successfully.',
      member: {
        id: member.id,
        email: member.email,
        profilePictureUrl: member.profilePictureUrl,
        bio: member.bio,
        mustResetPassword: member.mustResetPassword
      }
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.aeternum_session;

    if (token) {
      // Clear token from database
      await prisma.serverSession.delete({
        where: { token }
      }).catch(() => {
        // Suppress deletion error in case session was already cleared or does not exist
      });
    }

    // Clear client side cookie
    res.clearCookie('aeternum_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('[Logout Error]:', error);
    return res.status(500).json({ error: 'Internal server error during logout.' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const member = await prisma.member.findUnique({
      where: { id: userId }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    return res.status(200).json({
      member: {
        id: member.id,
        email: member.email,
        profilePictureUrl: member.profilePictureUrl,
        bio: member.bio,
        mustResetPassword: member.mustResetPassword,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
      }
    });
  } catch (error) {
    console.error('[Me Controller Error]:', error);
    return res.status(500).json({ error: 'Internal server error retrieving member profile.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.member.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustResetPassword: false
      }
    });

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[Password Reset Error]:', error);
    return res.status(500).json({ error: 'Internal server error resetting password.' });
  }
};
