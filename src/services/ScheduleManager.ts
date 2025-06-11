import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduleConfig, ScheduledLock } from '../types/LockManagerTypes';

const SCHEDULES_STORAGE_KEY = '@FocusGuard:schedules';

class ScheduleManager {
  /**
   * Adds a new lock schedule to local storage.
   * @param appPackageNames - An array of package names to be scheduled.
   * @param scheduleConfig - The configuration object for the schedule.
   * @returns The ID of the newly created schedule.
   */
  async addSchedule(appPackageNames: string[], scheduleConfig: ScheduleConfig): Promise<string> {
    console.log('[ScheduleManager] Adding new schedule with config:', JSON.stringify(scheduleConfig));
    console.log('[ScheduleManager] Apps to be scheduled:', appPackageNames);
    
    const scheduleId = `schedule_${Date.now()}`;
    
    const newSchedule: ScheduledLock = {
      id: scheduleId,
      userId: 'local_user',
      appPackageNames,
      scheduleConfig,
      isEnabled: true,
      createdAt: Date.now()
    };

    try {
      // Get existing schedules
      const existingSchedules = await this.getSchedulesForUser();
      console.log('[ScheduleManager] Existing schedules count:', existingSchedules.length);
      
      // Add new schedule
      const updatedSchedules = [...existingSchedules, newSchedule];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(updatedSchedules));
      
      console.log('[ScheduleManager] Schedule saved successfully. New total count:', updatedSchedules.length);
      console.log('[ScheduleManager] Full schedule details:', JSON.stringify(newSchedule, null, 2));
      return scheduleId;
    } catch (error) {
      console.error('[ScheduleManager] Failed to save schedule locally:', error);
      throw new Error('Failed to save schedule locally');
    }
  }

  /**
   * Retrieves all schedules from local storage.
   * @returns An array of ScheduledLock objects.
   */
  async getSchedulesForUser(): Promise<ScheduledLock[]> {
    try {
      console.log('[ScheduleManager] Retrieving schedules from storage');
      const schedulesJson = await AsyncStorage.getItem(SCHEDULES_STORAGE_KEY);
      if (!schedulesJson) {
        console.log('[ScheduleManager] No schedules found in storage');
        return [];
      }
      
      const schedules = JSON.parse(schedulesJson) as ScheduledLock[];
      console.log('[ScheduleManager] Retrieved schedules count:', schedules.length);
      console.log('[ScheduleManager] Active schedules:', schedules.filter(s => s.isEnabled).length);
      return schedules;
    } catch (error) {
      console.error('[ScheduleManager] Failed to load schedules from storage:', error);
      return [];
    }
  }

  /**
   * Updates an existing schedule in local storage.
   * @param scheduleId - The ID of the schedule to update.
   * @param updates - The partial ScheduledLock object containing updates.
   */
  async updateSchedule(scheduleId: string, updates: Partial<ScheduledLock>): Promise<void> {
    console.log('[ScheduleManager] Updating schedule:', scheduleId);
    console.log('[ScheduleManager] Update details:', JSON.stringify(updates));
    
    try {
      const schedules = await this.getSchedulesForUser();
      const updatedSchedules = schedules.map(schedule => 
        schedule.id === scheduleId ? { ...schedule, ...updates } : schedule
      );
      
      await AsyncStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(updatedSchedules));
      console.log('[ScheduleManager] Schedule updated successfully');
    } catch (error) {
      console.error('[ScheduleManager] Failed to update schedule:', error);
      throw new Error('Failed to update schedule');
    }
  }

  /**
   * Deletes a schedule from local storage.
   * @param scheduleId - The ID of the schedule to delete.
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    console.log('[ScheduleManager] Deleting schedule:', scheduleId);
    
    try {
      const schedules = await this.getSchedulesForUser();
      const updatedSchedules = schedules.filter(schedule => schedule.id !== scheduleId);
      
      await AsyncStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(updatedSchedules));
      console.log('[ScheduleManager] Schedule deleted successfully');
    } catch (error) {
      console.error('[ScheduleManager] Failed to delete schedule:', error);
      throw new Error('Failed to delete schedule');
    }
  }

  /**
   * Toggles a schedule's enabled state.
   * @param scheduleId - The ID of the schedule to toggle.
   * @param isEnabled - The new enabled state.
   */
  async toggleSchedule(scheduleId: string, isEnabled: boolean): Promise<void> {
    console.log('[ScheduleManager] Toggling schedule:', scheduleId, 'to:', isEnabled);
    await this.updateSchedule(scheduleId, { isEnabled });
  }
}

export const scheduleManager = new ScheduleManager(); 