import logger from '#config/logger.js';
import {
  deleteUser,
  getAllUsers,
  getUserById,
} from '#services/users.services.js';
import {
  updateUserSchema,
  userIdSchema,
} from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';
import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';

export const fetchAllUsers = async (req, res) => {
  try {
    logger.info('Fetching all users');
    const allUsers = await getAllUsers();
    res.status(200).json({
      message: 'Users fetched successfully',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    logger.error('Error fetching users', error);
    throw new Error('Error fetching users');
  }
};

export const fetchUserById = async (req, res) => {
  try {
    logger.info(`Getting user by id: ${req.params.id}`);
    // Validate the user ID parameter
    const validationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }
    const { id } = validationResult.data;
    const user = await getUserById(id);
    logger.info(`User ${user.email} retrieved successfully`);
    res.json({
      message: 'User retrieved successfully',
      user,
    });
  } catch (e) {
    logger.error(`Error fetching user by id: ${e.message}`);
    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
  }
};

export const updateUser = async (id, updates) => {
  try {
    // First check if user exists
    const existingUser = await getUserById(id);

    // Check if email is being updated and if it already exists
    if (updates.email && updates.email !== existingUser.email) {
      const [emailExists] = await db
        .select()
        .from(users)
        .where(eq(users.email, updates.email))
        .limit(1);
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date(),
    };

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`User ${updatedUser.email} updated successfully`);
    return updatedUser;
  } catch (e) {
    logger.error(`Error updating user ${id}:`, e);
    throw e;
  }
};

export const updateUserById = async (req, res) => {
  try {
    logger.info(`Updating user: ${req.params.id}`);
    // Validate the user ID parameter
    const idValidationResult = userIdSchema.safeParse({ id: req.params.id });
    if (!idValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidationResult.error),
      });
    }
    // Validate the update data
    const updateValidationResult = updateUserSchema.safeParse(req.body);
    if (!updateValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(updateValidationResult.error),
      });
    }
    const { id } = idValidationResult.data;
    const updates = updateValidationResult.data;
    // Authorization checks
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to update user information',
      });
    }
    // Allow users to update only their own information (except role)
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own information',
      });
    }
    // Only admin users can change roles
    if (updates.role && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only administrators can change user roles',
      });
    }
    // Remove role from updates if non-admin user is trying to update their own profile
    if (req.user.role !== 'admin') {
      delete updates.role;
    }
    const updatedUser = await updateUser(id, updates);
    logger.info(`User ${updatedUser.email} updated successfully`);
    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (e) {
    logger.error(`Error updating user: ${e.message}`);
    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (e.message === 'Email already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    throw new Error('Error updating user');
  }
};

export const deleteUserById = async (req, res) => {
  try {
    logger.info(`Deleting user: ${req.params.id}`);
    // Validate the user ID parameter
    const validationResult = userIdSchema.safeParse({ id: req.params.id });
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }
    const { id } = validationResult.data;
    // Authorization checks
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to delete users',
      });
    }
    // Only admin users can delete users (prevent self-deletion or user deletion by non-admins)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only administrators can delete users',
      });
    }
    // Prevent admins from deleting themselves
    if (req.user.id === id) {
      return res.status(403).json({
        error: 'Operation denied',
        message: 'You cannot delete your own account',
      });
    }
    const deletedUser = await deleteUser(id);
    logger.info(`User ${deletedUser.email} deleted successfully`);
    res.json({
      message: 'User deleted successfully',
      user: deletedUser,
    });
  } catch (e) {
    logger.error(`Error deleting user: ${e.message}`);
    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    throw new Error('Error deleting user');
  }
};
