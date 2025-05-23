// backend/services/UserService.js
import { BaseService } from './BaseService.js';
import * as UserModel from '../models/User.js';

export class UserService extends BaseService {
  async getUserProfile(userId) {
    return UserModel.findById(userId);
  }

  async updateUserProfile(userId, updateData) {
    return this.executeInTransaction(async (client) => {
      return UserModel.updateProfile(userId, updateData, client);
    });
  }
}