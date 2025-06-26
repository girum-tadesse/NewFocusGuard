import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const APP_USAGE_KEY = '@FocusGuard:appUsage';
const DAILY_USAGE_KEY = '@FocusGuard:dailyUsage';
const LOCKS_HISTORY_KEY = '@FocusGuard:locksHistory';

// Time period type
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Basic types for tracking
export interface AppUsage {
  packageName: string;
  appName: string;
  totalTimeMs: number;
  lastUsed: number;
}

export interface DailyUsage {
  date: string; // ISO date string
  totalTimeMs: number;
  unlockCount: number;
}

export interface LockEvent {
  appName: string;
  packageName: string;
  startTime: number;
  endTime: number;
  wasSuccessful: boolean; // Did the user respect the lock or bypass it?
}

// Insight card types
export type InsightType = 
  | 'most_used_app' 
  | 'usage_trend' 
  | 'peak_time' 
  | 'weekly_summary' 
  | 'lock_effectiveness'
  | 'streak'
  | 'suggestion';

export interface InsightCard {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  value?: string | number;
  secondaryValue?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  icon?: string;
  color?: string;
  actionText?: string;
  actionRoute?: string;
  date: number; // Timestamp when insight was generated
}

class InsightsService {
  private static instance: InsightsService;
  
  private constructor() {}
  
  public static getInstance(): InsightsService {
    if (!InsightsService.instance) {
      InsightsService.instance = new InsightsService();
    }
    return InsightsService.instance;
  }

  // Initialize storage if needed
  public async initialize(): Promise<void> {
    try {
      const appUsage = await AsyncStorage.getItem(APP_USAGE_KEY);
      if (!appUsage) {
        await AsyncStorage.setItem(APP_USAGE_KEY, JSON.stringify([]));
      }
      
      const dailyUsage = await AsyncStorage.getItem(DAILY_USAGE_KEY);
      if (!dailyUsage) {
        await AsyncStorage.setItem(DAILY_USAGE_KEY, JSON.stringify([]));
      }
      
      const locksHistory = await AsyncStorage.getItem(LOCKS_HISTORY_KEY);
      if (!locksHistory) {
        await AsyncStorage.setItem(LOCKS_HISTORY_KEY, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Failed to initialize insights storage:', error);
    }
  }

  // Record app usage
  public async recordAppUsage(packageName: string, appName: string, durationMs: number): Promise<void> {
    try {
      const appUsageJson = await AsyncStorage.getItem(APP_USAGE_KEY);
      const appUsage: AppUsage[] = appUsageJson ? JSON.parse(appUsageJson) : [];
      
      // Find or create app entry
      const existingAppIndex = appUsage.findIndex(app => app.packageName === packageName);
      const now = Date.now();
      
      if (existingAppIndex >= 0) {
        // Update existing app
        appUsage[existingAppIndex].totalTimeMs += durationMs;
        appUsage[existingAppIndex].lastUsed = now;
      } else {
        // Add new app
        appUsage.push({
          packageName,
          appName,
          totalTimeMs: durationMs,
          lastUsed: now
        });
      }
      
      await AsyncStorage.setItem(APP_USAGE_KEY, JSON.stringify(appUsage));
      
      // Update daily usage
      await this.recordDailyUsage(durationMs);
    } catch (error) {
      console.error('Failed to record app usage:', error);
    }
  }

  // Record daily usage
  private async recordDailyUsage(durationMs: number, unlockCount: number = 0): Promise<void> {
    try {
      const dailyUsageJson = await AsyncStorage.getItem(DAILY_USAGE_KEY);
      const dailyUsage: DailyUsage[] = dailyUsageJson ? JSON.parse(dailyUsageJson) : [];
      
      // Get today's date in ISO format
      const today = new Date().toISOString().split('T')[0];
      
      // Find or create today's entry
      const todayIndex = dailyUsage.findIndex(day => day.date === today);
      
      if (todayIndex >= 0) {
        // Update today's usage
        dailyUsage[todayIndex].totalTimeMs += durationMs;
        dailyUsage[todayIndex].unlockCount += unlockCount;
      } else {
        // Add new day
        dailyUsage.push({
          date: today,
          totalTimeMs: durationMs,
          unlockCount: unlockCount
        });
      }
      
      // Keep only the last 365 days (to have yearly data)
      const sortedDailyUsage = dailyUsage
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 365);
      
      await AsyncStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(sortedDailyUsage));
    } catch (error) {
      console.error('Failed to record daily usage:', error);
    }
  }

  // Record a lock event
  public async recordLockEvent(
    appName: string, 
    packageName: string, 
    startTime: number, 
    endTime: number, 
    wasSuccessful: boolean
  ): Promise<void> {
    try {
      const locksHistoryJson = await AsyncStorage.getItem(LOCKS_HISTORY_KEY);
      const locksHistory: LockEvent[] = locksHistoryJson ? JSON.parse(locksHistoryJson) : [];
      
      // Add new lock event
      locksHistory.push({
        appName,
        packageName,
        startTime,
        endTime,
        wasSuccessful
      });
      
      // Keep only the last 365 lock events (to have yearly data)
      const trimmedLockHistory = locksHistory.slice(-365);
      
      await AsyncStorage.setItem(LOCKS_HISTORY_KEY, JSON.stringify(trimmedLockHistory));
    } catch (error) {
      console.error('Failed to record lock event:', error);
    }
  }

  // Get insights cards - always generate all cards with defaults if no data
  public async getInsightCards(timePeriod: TimePeriod = 'weekly'): Promise<InsightCard[]> {
    try {
      const insights: InsightCard[] = [];
      
      // Get the necessary data
      const [appUsageJson, dailyUsageJson, locksHistoryJson] = await Promise.all([
        AsyncStorage.getItem(APP_USAGE_KEY),
        AsyncStorage.getItem(DAILY_USAGE_KEY),
        AsyncStorage.getItem(LOCKS_HISTORY_KEY)
      ]);
      
      const appUsage: AppUsage[] = appUsageJson ? JSON.parse(appUsageJson) : [];
      const dailyUsage: DailyUsage[] = dailyUsageJson ? JSON.parse(dailyUsageJson) : [];
      const locksHistory: LockEvent[] = locksHistoryJson ? JSON.parse(locksHistoryJson) : [];
      
      // Filter data based on selected time period
      const { filteredDailyUsage, filteredLocksHistory } = this.filterDataByTimePeriod(
        dailyUsage,
        locksHistory,
        timePeriod
      );
      
      // 1. Most used app insight for the selected time period
      const mostUsedApp = this.getMostUsedApp(appUsage, filteredDailyUsage);
      insights.push({
        id: 'most_used_app',
        type: 'most_used_app',
        title: 'Most Used App',
        description: mostUsedApp 
          ? `You've spent the most time on ${mostUsedApp.appName}`
          : 'No app usage data yet.',
        value: mostUsedApp ? this.formatTime(mostUsedApp.totalTimeMs) : '0h 0m',
        icon: 'apps',
        color: '#FFC107',
        date: Date.now()
      });

      // 2. Usage summary for the selected time period
      const totalTime = filteredDailyUsage.reduce((sum, day) => sum + day.totalTimeMs, 0);
      const avgDailyTime = filteredDailyUsage.length > 0 ? totalTime / filteredDailyUsage.length : 0;

      insights.push({
        id: 'usage_summary',
        type: 'weekly_summary', // Keep the type for consistent styling
        title: `${this.capitalizeFirstLetter(timePeriod)} Screen Time`,
        description: filteredDailyUsage.length > 0 
          ? `Your average daily screen time`
          : `No screen time data yet for this period.`,
        value: this.formatTime(avgDailyTime),
        secondaryValue: this.formatTime(totalTime),
        icon: 'calendar',
        color: '#2196F3',
        date: Date.now()
      });
      
      // 3. Today's usage trend (or current period vs previous period)
      const trendData = this.calculateUsageTrend(dailyUsage, timePeriod);
      
        insights.push({
          id: 'usage_trend',
          type: 'usage_trend',
        title: 'Usage Trend',
        description: trendData.description,
        value: trendData.value,
        trend: trendData.trend,
        trendValue: trendData.trendValue,
        icon: 'trending-up',
        color: '#9C27B0',
          date: Date.now()
        });
      
      // 4. Lock effectiveness
      const successfulLocks = filteredLocksHistory.filter(lock => lock.wasSuccessful).length;
      const totalLocks = filteredLocksHistory.length;
      const successRate = totalLocks > 0 ? (successfulLocks / totalLocks) * 100 : 0;
      
      insights.push({
        id: 'lock_effectiveness',
        type: 'lock_effectiveness',
        title: 'Lock Effectiveness',
        description: totalLocks > 0 
          ? `You respected ${successfulLocks} out of ${totalLocks} app locks`
          : `No app locks recorded yet.`,
        value: `${Math.round(successRate)}%`,
        icon: 'lock-closed',
        color: '#4CAF50',
        date: Date.now()
      });
      
      // 5. Peak usage time
      const hourlyUsage = this.calculateHourlyUsage(filteredLocksHistory);
      const peakHour = hourlyUsage.indexOf(Math.max(...hourlyUsage));
      const peakHourFormatted = this.formatHour(peakHour);
      
      insights.push({
        id: 'peak_time',
        type: 'peak_time',
        title: 'Peak Usage Time',
        description: Math.max(...hourlyUsage) > 0 
          ? `Your device usage peaks around ${peakHourFormatted}`
          : `Not enough data to determine peak usage time.`,
        value: peakHourFormatted,
        icon: 'time',
        color: '#FF5722',
        date: Date.now()
      });
      
      return insights;
    } catch (error) {
      console.error('Failed to get insight cards:', error);
      return [];
    }
  }

  // Helper method to filter data based on time period
  private filterDataByTimePeriod(
    dailyUsage: DailyUsage[],
    locksHistory: LockEvent[],
    timePeriod: TimePeriod
  ): { filteredDailyUsage: DailyUsage[]; filteredLocksHistory: LockEvent[]; periodLabel: string } {
    const now = new Date();
    let cutoffDate = new Date();
    let periodLabel = '';
    
    switch (timePeriod) {
      case 'daily':
        // Today only
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodLabel = 'today';
        break;
      case 'weekly':
        // Last 7 days
        cutoffDate.setDate(now.getDate() - 7);
        periodLabel = 'this week';
        break;
      case 'monthly':
        // Last 30 days
        cutoffDate.setDate(now.getDate() - 30);
        periodLabel = 'this month';
        break;
      case 'yearly':
        // Last 365 days
        cutoffDate.setDate(now.getDate() - 365);
        periodLabel = 'this year';
        break;
    }
    
    const cutoffTime = cutoffDate.getTime();
    
    // Filter daily usage
    const filteredDailyUsage = dailyUsage.filter(day => {
      const dayTime = new Date(day.date).getTime();
      return dayTime >= cutoffTime;
    });
    
    // Filter lock history
    const filteredLocksHistory = locksHistory.filter(lock => lock.startTime >= cutoffTime);
    
    return { filteredDailyUsage, filteredLocksHistory, periodLabel };
  }

  // Helper method to get most used app for a time period
  private getMostUsedApp(appUsage: AppUsage[], filteredDailyUsage: DailyUsage[]): AppUsage | null {
    if (appUsage.length === 0 || filteredDailyUsage.length === 0) {
      return null;
    }
    
    // Create a copy of app usage to avoid modifying the original
    const appUsageCopy = [...appUsage];
    
    // Sort by total time
    const sortedApps = appUsageCopy.sort((a, b) => b.totalTimeMs - a.totalTimeMs);
    
    // Return the app with the most usage
    return sortedApps.length > 0 ? sortedApps[0] : null;
  }

  // Helper method to calculate usage trend
  private calculateUsageTrend(dailyUsage: DailyUsage[], timePeriod: TimePeriod): {
    trend: 'up' | 'down' | 'neutral';
    trendValue: string;
    description: string;
    value: string;
  } {
    const now = new Date();
    let currentPeriodStart: Date;
    let previousPeriodStart: Date;
    let periodName: string;
    
    switch (timePeriod) {
      case 'daily':
        // Compare today with yesterday
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        periodName = 'yesterday';
        break;
      case 'weekly':
        // Compare this week with last week
        currentPeriodStart = new Date(now.getTime());
        currentPeriodStart.setDate(now.getDate() - 7);
        previousPeriodStart = new Date(currentPeriodStart.getTime());
        previousPeriodStart.setDate(currentPeriodStart.getDate() - 7);
        periodName = 'last week';
        break;
      case 'monthly':
        // Compare this month with last month
        currentPeriodStart = new Date(now.getTime());
        currentPeriodStart.setDate(now.getDate() - 30);
        previousPeriodStart = new Date(currentPeriodStart.getTime());
        previousPeriodStart.setDate(currentPeriodStart.getDate() - 30);
        periodName = 'last month';
        break;
      case 'yearly':
        // Compare this year with last year
        currentPeriodStart = new Date(now.getTime());
        currentPeriodStart.setDate(now.getDate() - 365);
        previousPeriodStart = new Date(currentPeriodStart.getTime());
        previousPeriodStart.setDate(currentPeriodStart.getDate() - 365);
        periodName = 'last year';
        break;
    }
    
    const currentPeriodTime = currentPeriodStart.getTime();
    const previousPeriodTime = previousPeriodStart.getTime();
    
    // Filter daily usage for current and previous periods
    const currentPeriodUsage = dailyUsage.filter(day => {
      const dayTime = new Date(day.date).getTime();
      return dayTime >= currentPeriodTime;
    });
    
    const previousPeriodUsage = dailyUsage.filter(day => {
      const dayTime = new Date(day.date).getTime();
      return dayTime >= previousPeriodTime && dayTime < currentPeriodTime;
    });
    
    // Calculate total usage for each period
    const currentTotal = currentPeriodUsage.reduce((sum, day) => sum + day.totalTimeMs, 0);
    const previousTotal = previousPeriodUsage.reduce((sum, day) => sum + day.totalTimeMs, 0);
    
    // Default values
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    let trendValue = '0%';
    let description = `No usage data to compare with ${periodName}.`;
    let value = this.formatTime(currentTotal);
    
    // Calculate trend if we have data for both periods
    if (previousTotal > 0) {
      const percentChange = ((currentTotal - previousTotal) / previousTotal) * 100;
      trend = percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'neutral';
      trendValue = `${Math.abs(Math.round(percentChange))}%`;
      
      if (trend === 'up') {
        description = `Your usage is higher than ${periodName}.`;
      } else if (trend === 'down') {
        description = `Your usage is lower than ${periodName}.`;
      } else {
        description = `Your usage is similar to ${periodName}.`;
      }
    }
    
    return { trend, trendValue, description, value };
  }

  // Helper method to calculate hourly usage
  private calculateHourlyUsage(locksHistory: LockEvent[]): number[] {
    const hourlyUsage = new Array(24).fill(0);
    
    for (const lock of locksHistory) {
      const startHour = new Date(lock.startTime).getHours();
      const endHour = new Date(lock.endTime).getHours();
      const duration = lock.endTime - lock.startTime;
      
      if (startHour === endHour) {
        hourlyUsage[startHour] += duration;
      } else {
        // Distribute usage across hours
        const startMinutes = new Date(lock.startTime).getMinutes();
        const endMinutes = new Date(lock.endTime).getMinutes();
        
        // First hour
        const firstHourMs = (60 - startMinutes) * 60 * 1000;
        hourlyUsage[startHour] += Math.min(firstHourMs, duration);
        
        // Middle hours
        for (let h = startHour + 1; h < endHour; h++) {
          hourlyUsage[h % 24] += 60 * 60 * 1000;
        }
        
        // Last hour
        if (startHour !== endHour) {
          hourlyUsage[endHour] += endMinutes * 60 * 1000;
        }
      }
    }
    
    return hourlyUsage;
  }

  // Format hour to AM/PM
  private formatHour(hour: number): string {
    return hour === 0 ? '12 AM' : 
           hour < 12 ? `${hour} AM` : 
           hour === 12 ? '12 PM' : 
           `${hour - 12} PM`;
  }

  // Capitalize first letter of a string
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Get app usage data
  public async getAppUsage(): Promise<AppUsage[]> {
    try {
      const appUsageJson = await AsyncStorage.getItem(APP_USAGE_KEY);
      return appUsageJson ? JSON.parse(appUsageJson) : [];
    } catch (error) {
      console.error('Failed to get app usage:', error);
      return [];
    }
  }

  // Get daily usage data
  public async getDailyUsage(): Promise<DailyUsage[]> {
    try {
      const dailyUsageJson = await AsyncStorage.getItem(DAILY_USAGE_KEY);
      return dailyUsageJson ? JSON.parse(dailyUsageJson) : [];
    } catch (error) {
      console.error('Failed to get daily usage:', error);
      return [];
    }
  }

  // Get locks history
  public async getLocksHistory(): Promise<LockEvent[]> {
    try {
      const locksHistoryJson = await AsyncStorage.getItem(LOCKS_HISTORY_KEY);
      return locksHistoryJson ? JSON.parse(locksHistoryJson) : [];
    } catch (error) {
      console.error('Failed to get locks history:', error);
      return [];
    }
  }

  // Format time in ms to a readable string (e.g. "2h 30m")
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  public async resetData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(APP_USAGE_KEY, JSON.stringify([])),
        AsyncStorage.setItem(DAILY_USAGE_KEY, JSON.stringify([])),
        AsyncStorage.setItem(LOCKS_HISTORY_KEY, JSON.stringify([]))
      ]);
      console.log('All insights data has been reset.');
    } catch (error) {
      console.error('Failed to reset data:', error);
      throw error;
    }
  }
}

export default InsightsService;
