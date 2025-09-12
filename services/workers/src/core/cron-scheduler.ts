import { Logger } from 'pino';
import { CrashProofQueue } from './crash-proof-queue';
import { CronJobConfig, JobPriority } from './queue-types';

interface CronJob {
  name: string;
  pattern: string;
  jobType: string;
  data: any;
  queue: CrashProofQueue;
  nextRun: Date;
  enabled: boolean;
  timezone: string;
  lastRun?: Date;
  runCount: number;
  errorCount: number;
}

export class CronScheduler {
  private cronJobs: Map<string, CronJob> = new Map();
  private schedulerInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkInterval = 1000; // Check every second

  constructor(private logger: Logger) {}

  start(): void {
    if (this.isRunning) {
      this.logger.warn('Cron scheduler is already running');
      return;
    }

    this.isRunning = true;
    this.schedulerInterval = setInterval(() => {
      this.checkAndRunJobs();
    }, this.checkInterval);

    this.logger.info('Cron scheduler started');
  }

  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.isRunning = false;
    this.logger.info('Cron scheduler stopped');
  }

  addCronJob(
    config: CronJobConfig,
    queue: CrashProofQueue
  ): void {
    try {
      const nextRun = this.getNextRunTime(config.pattern, config.timezone);
      
      const cronJob: CronJob = {
        name: config.name,
        pattern: config.pattern,
        jobType: config.jobType,
        data: config.data,
        queue: queue,
        nextRun: nextRun,
        enabled: config.enabled,
        timezone: config.timezone || 'UTC',
        runCount: 0,
        errorCount: 0
      };

      this.cronJobs.set(config.name, cronJob);
      this.logger.info(`Cron job '${config.name}' added. Next run: ${nextRun.toISOString()}`);
    } catch (error) {
      this.logger.error(`Failed to add cron job '${config.name}':`, error);
      throw error;
    }
  }

  removeCronJob(name: string): boolean {
    const removed = this.cronJobs.delete(name);
    if (removed) {
      this.logger.info(`Cron job '${name}' removed`);
    } else {
      this.logger.warn(`Cron job '${name}' not found for removal`);
    }
    return removed;
  }

  enableCronJob(name: string): boolean {
    const job = this.cronJobs.get(name);
    if (!job) {
      this.logger.warn(`Cron job '${name}' not found`);
      return false;
    }

    job.enabled = true;
    job.nextRun = this.getNextRunTime(job.pattern, job.timezone);
    this.logger.info(`Cron job '${name}' enabled. Next run: ${job.nextRun.toISOString()}`);
    return true;
  }

  disableCronJob(name: string): boolean {
    const job = this.cronJobs.get(name);
    if (!job) {
      this.logger.warn(`Cron job '${name}' not found`);
      return false;
    }

    job.enabled = false;
    this.logger.info(`Cron job '${name}' disabled`);
    return true;
  }

  getCronJobStatus(name: string): any {
    const job = this.cronJobs.get(name);
    if (!job) {
      return null;
    }

    return {
      name: job.name,
      pattern: job.pattern,
      enabled: job.enabled,
      nextRun: job.nextRun.toISOString(),
      lastRun: job.lastRun?.toISOString(),
      runCount: job.runCount,
      errorCount: job.errorCount,
      timezone: job.timezone
    };
  }

  getAllCronJobs(): any[] {
    return Array.from(this.cronJobs.values()).map(job => ({
      name: job.name,
      pattern: job.pattern,
      enabled: job.enabled,
      nextRun: job.nextRun.toISOString(),
      lastRun: job.lastRun?.toISOString(),
      runCount: job.runCount,
      errorCount: job.errorCount,
      timezone: job.timezone,
      queueName: job.queue.getQueueName()
    }));
  }

  private async checkAndRunJobs(): Promise<void> {
    const now = new Date();

    for (const [name, job] of this.cronJobs.entries()) {
      if (!job.enabled) continue;

      try {
        if (now >= job.nextRun) {
          await this.runCronJob(job);
          
          // Calculate next run time
          job.nextRun = this.getNextRunTime(job.pattern, job.timezone);
          job.lastRun = now;
          job.runCount++;
          
          this.logger.info(`Cron job '${name}' executed. Next run: ${job.nextRun.toISOString()}`);
        }
      } catch (error) {
        job.errorCount++;
        this.logger.error(`Error running cron job '${name}':`, error);
        
        // Still calculate next run time even if job failed
        try {
          job.nextRun = this.getNextRunTime(job.pattern, job.timezone);
        } catch (nextRunError) {
          this.logger.error(`Error calculating next run time for '${name}':`, nextRunError);
          // Disable job if we can't calculate next run time
          job.enabled = false;
        }
      }
    }
  }

  private async runCronJob(job: CronJob): Promise<void> {
    if (!job.queue.isReady()) {
      throw new Error(`Queue ${job.queue.getQueueName()} is not ready`);
    }

    // Add job to queue with high priority (cron jobs are typically important)
    await job.queue.addJob(job.jobType, job.data, {
      priority: JobPriority.HIGH,
      jobId: `cron-${job.name}-${Date.now()}` // Unique ID for cron jobs
    });
  }

  private getNextRunTime(cronPattern: string, timezone: string = 'UTC'): Date {
    // Parse cron expression: minute hour day month dayOfWeek
    const parts = cronPattern.trim().split(/\s+/);
    
    if (parts.length !== 5) {
      throw new Error(`Invalid cron pattern: ${cronPattern}. Expected 5 parts (minute hour day month dayOfWeek)`);
    }

    const [minute, hour, day, month, dayOfWeek] = parts;
    
    // Get current time in specified timezone
    const now = new Date();
    const currentTime = this.convertToTimezone(now, timezone);
    
    // Calculate next run time
    let nextRun = new Date(currentTime);
    nextRun.setSeconds(0, 0); // Reset seconds and milliseconds

    // Parse and apply cron fields
    const nextMinute = this.parseField(minute, 0, 59);
    const nextHour = this.parseField(hour, 0, 23);
    const nextDay = this.parseField(day, 1, 31);
    const nextMonth = this.parseField(month, 1, 12);
    const nextDayOfWeek = this.parseField(dayOfWeek, 0, 7); // 0 and 7 are Sunday

    // Find the next valid time
    nextRun = this.findNextValidTime(nextRun, nextMinute, nextHour, nextDay, nextMonth, nextDayOfWeek);

    // Convert back to UTC if necessary
    return this.convertFromTimezone(nextRun, timezone);
  }

  private parseField(field: string, min: number, max: number): number[] {
    const values: number[] = [];

    if (field === '*') {
      // All values
      for (let i = min; i <= max; i++) {
        values.push(i);
      }
    } else if (field.includes('/')) {
      // Step values (e.g., */5, 0-30/5)
      const [range, step] = field.split('/');
      const stepValue = parseInt(step);
      
      let start = min;
      let end = max;
      
      if (range !== '*') {
        if (range.includes('-')) {
          const [rangeStart, rangeEnd] = range.split('-').map(Number);
          start = rangeStart;
          end = rangeEnd;
        } else {
          start = end = parseInt(range);
        }
      }
      
      for (let i = start; i <= end; i += stepValue) {
        if (i >= min && i <= max) {
          values.push(i);
        }
      }
    } else if (field.includes('-')) {
      // Range (e.g., 1-5)
      const [start, end] = field.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        values.push(i);
      }
    } else if (field.includes(',')) {
      // List (e.g., 1,3,5)
      field.split(',').forEach(val => {
        const num = parseInt(val.trim());
        if (num >= min && num <= max) {
          values.push(num);
        }
      });
    } else {
      // Single value
      const num = parseInt(field);
      if (num >= min && num <= max) {
        values.push(num);
      }
    }

    return values.sort((a, b) => a - b);
  }

  private findNextValidTime(
    startTime: Date,
    validMinutes: number[],
    validHours: number[],
    validDays: number[],
    validMonths: number[],
    validDaysOfWeek: number[]
  ): Date {
    let nextTime = new Date(startTime);
    nextTime.setMinutes(nextTime.getMinutes() + 1); // Start from next minute

    // Search for up to 4 years (to handle edge cases with leap years)
    const maxIterations = 4 * 365 * 24 * 60;
    let iterations = 0;

    while (iterations < maxIterations) {
      const minute = nextTime.getMinutes();
      const hour = nextTime.getHours();
      const day = nextTime.getDate();
      const month = nextTime.getMonth() + 1; // getMonth() returns 0-11
      const dayOfWeek = nextTime.getDay(); // 0 = Sunday

      // Check if current time matches all cron fields
      const minuteMatch = validMinutes.includes(minute);
      const hourMatch = validHours.includes(hour);
      const dayMatch = validDays.includes(day);
      const monthMatch = validMonths.includes(month);
      const dayOfWeekMatch = validDaysOfWeek.includes(dayOfWeek) || 
                           (dayOfWeek === 0 && validDaysOfWeek.includes(7)); // Sunday can be 0 or 7

      if (minuteMatch && hourMatch && dayMatch && monthMatch && dayOfWeekMatch) {
        return nextTime;
      }

      // Move to next minute
      nextTime.setMinutes(nextTime.getMinutes() + 1);
      iterations++;
    }

    throw new Error('Could not find next valid cron time within reasonable bounds');
  }

  private convertToTimezone(date: Date, timezone: string): Date {
    if (timezone === 'UTC') {
      return new Date(date);
    }

    try {
      // Use Intl.DateTimeFormat to handle timezone conversion
      const utcTime = date.getTime();
      const tempDate = new Date(utcTime);
      
      // This is a simplified implementation
      // In production, you might want to use a library like moment-timezone
      return tempDate;
    } catch (error) {
      this.logger.warn(`Invalid timezone '${timezone}', using UTC`);
      return new Date(date);
    }
  }

  private convertFromTimezone(date: Date, timezone: string): Date {
    if (timezone === 'UTC') {
      return new Date(date);
    }

    try {
      // Convert back to UTC
      return new Date(date);
    } catch (error) {
      this.logger.warn(`Invalid timezone '${timezone}', using UTC`);
      return new Date(date);
    }
  }

  // Predefined common cron patterns
  static readonly PATTERNS = {
    EVERY_MINUTE: '* * * * *',
    EVERY_5_MINUTES: '*/5 * * * *',
    EVERY_10_MINUTES: '*/10 * * * *',
    EVERY_15_MINUTES: '*/15 * * * *',
    EVERY_30_MINUTES: '*/30 * * * *',
    HOURLY: '0 * * * *',
    EVERY_2_HOURS: '0 */2 * * *',
    EVERY_6_HOURS: '0 */6 * * *',
    EVERY_12_HOURS: '0 */12 * * *',
    DAILY: '0 0 * * *',
    DAILY_AT_NOON: '0 12 * * *',
    WEEKLY: '0 0 * * 0',
    MONTHLY: '0 0 1 * *',
    YEARLY: '0 0 1 1 *'
  };

  // Utility method to validate cron pattern
  static validateCronPattern(pattern: string): boolean {
    try {
      const scheduler = new CronScheduler(console as any);
      scheduler.getNextRunTime(pattern);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Utility method to get next few run times for a pattern
  static getNextRunTimes(pattern: string, count: number = 5, timezone: string = 'UTC'): Date[] {
    const scheduler = new CronScheduler(console as any);
    const times: Date[] = [];
    let currentTime = new Date();

    for (let i = 0; i < count; i++) {
      const nextTime = scheduler.getNextRunTime(pattern, timezone);
      times.push(nextTime);
      currentTime = new Date(nextTime.getTime() + 60000); // Add 1 minute
    }

    return times;
  }

  getSchedulerStats(): {
    isRunning: boolean;
    totalJobs: number;
    enabledJobs: number;
    disabledJobs: number;
    totalRuns: number;
    totalErrors: number;
  } {
    const jobs = Array.from(this.cronJobs.values());
    
    return {
      isRunning: this.isRunning,
      totalJobs: jobs.length,
      enabledJobs: jobs.filter(job => job.enabled).length,
      disabledJobs: jobs.filter(job => !job.enabled).length,
      totalRuns: jobs.reduce((sum, job) => sum + job.runCount, 0),
      totalErrors: jobs.reduce((sum, job) => sum + job.errorCount, 0)
    };
  }

  async gracefulShutdown(): Promise<void> {
    this.logger.info('Starting graceful shutdown of cron scheduler');
    
    this.stop();
    
    // Wait for any pending operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.logger.info('Cron scheduler shutdown completed');
  }
}