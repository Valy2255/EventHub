// backend/controllers/userController.js
import { UserService } from '../services/UserService.js';

const userService = new UserService();

/**
 * GET /api/users/me
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserProfile(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ success: false, message: 'Failed to get user profile', error: error.message });
  }
};

/**
 * PUT /api/users/me
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, profileImage } = req.body;
    const updateData = { name, email, profile_image: profileImage };

    const updatedUser = await userService.updateUserProfile(userId, updateData);
    res.status(200).json({ success: true, message: 'Profile updated successfully', ...updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};
