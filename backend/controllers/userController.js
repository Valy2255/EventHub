// backend/controllers/userController.js
import * as User from '../models/User.js';

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from auth middleware
    const { name, email, profileImage } = req.body;
    
    // Update user profile
    const updatedUser = await User.updateProfile(userId, {
      name,
      email,
      profile_image: profileImage
    });
    
    // Return updated user data
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      ...updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      ...user
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

