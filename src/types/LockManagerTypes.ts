export interface ActiveLock {
  packageName: string;
  lockEndTime: number; // Unix timestamp (milliseconds)
  lockStartTime: number; // Unix timestamp (milliseconds)
}

export interface ScheduleConfig {
  startDate?: Date;      // Optional: Specific start date for the lock
  endDate?: Date;        // Optional: Specific end date if not using duration
  startTime: Date;       // Specific start time for the lock
  endTime: Date;         // Specific end time for the lock
  // selectedDays is an array of 7 booleans [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  // True if the day is selected for recurrence.
  // If no days are true, and startDate is provided, it's a one-time schedule for startDate.
  // If no days are true, and no startDate, it implies schedule for "today" if time is valid, or next valid day based on startTime.
  selectedDays: boolean[]; 
}

export interface ScheduledLock {
  id: string; // Unique identifier for the schedule
  userId: string; // Firebase Auth user ID
  appPackageNames: string[];
  scheduleConfig: ScheduleConfig;
  isEnabled: boolean;
  // This will be a server-generated timestamp upon creation.
  // When read from Firestore, it will be a Timestamp object, which can be converted to a Date.
  createdAt: any; 
} 