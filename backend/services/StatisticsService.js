// ================================
// backend/services/StatisticsService.js
// ================================
import { BaseService } from './BaseService.js';
import * as StatisticsModel from '../models/Statistics.js';

export class StatisticsService extends BaseService {
  async getEventStatistics() {
    return StatisticsModel.getEventStatistics();
  }

  async getUpcomingEventsCount() {
    return StatisticsModel.getUpcomingEventsCount();
  }
}