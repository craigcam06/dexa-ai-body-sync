import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface DailyInsight {
  recovery: number;
  sleepScore: number;
  recommendedTraining: string;
  macroTargets: {
    protein: number;
    carbs: number;
    fats: number;
  };
  alerts: string[];
}

class NotificationService {
  private isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Notifications not available on web platform');
      return false;
    }

    try {
      // Request permission for push notifications
      const pushResult = await PushNotifications.requestPermissions();
      
      // Request permission for local notifications
      const localResult = await LocalNotifications.requestPermissions();

      return pushResult.receive === 'granted' && localResult.display === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  async scheduleDailyInsights(insights: DailyInsight, time: { hour: number; minute: number }): Promise<void> {
    if (!this.isAvailable()) {
      console.log('Would schedule daily insights:', insights);
      return;
    }

    try {
      const schedule: ScheduleOptions = {
        notifications: [
          {
            title: `Recovery: ${insights.recovery}%`,
            body: this.generateInsightMessage(insights),
            id: 1,
            schedule: {
              on: {
                hour: time.hour,
                minute: time.minute
              },
              repeats: true
            },
            actionTypeId: 'DAILY_INSIGHTS',
            extra: {
              type: 'daily_insights',
              data: insights
            }
          }
        ]
      };

      await LocalNotifications.schedule(schedule);
      console.log('Daily insights scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule daily insights:', error);
    }
  }

  async scheduleWorkoutReminder(workoutType: string, time: Date): Promise<void> {
    if (!this.isAvailable()) {
      console.log('Would schedule workout reminder:', workoutType, time);
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `${workoutType} Workout`,
            body: 'Time for your scheduled workout!',
            id: Date.now(),
            schedule: {
              at: time
            },
            actionTypeId: 'WORKOUT_REMINDER',
            extra: {
              type: 'workout_reminder',
              workoutType
            }
          }
        ]
      });
    } catch (error) {
      console.error('Failed to schedule workout reminder:', error);
    }
  }

  async sendRecoveryAlert(recovery: number): Promise<void> {
    if (!this.isAvailable()) {
      console.log('Would send recovery alert:', recovery);
      return;
    }

    let message = '';
    if (recovery < 33) {
      message = 'Recovery is critically low. Consider rest or light activity today.';
    } else if (recovery < 66) {
      message = 'Recovery is moderate. Scale back training intensity today.';
    } else {
      message = 'Recovery is optimal. Perfect day for challenging workouts!';
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `Recovery Alert: ${recovery}%`,
            body: message,
            id: Date.now(),
            actionTypeId: 'RECOVERY_ALERT',
            extra: {
              type: 'recovery_alert',
              recovery
            }
          }
        ]
      });
    } catch (error) {
      console.error('Failed to send recovery alert:', error);
    }
  }

  async sendMacroReminder(macrosRemaining: { protein: number; carbs: number; fats: number }): Promise<void> {
    if (!this.isAvailable()) {
      console.log('Would send macro reminder:', macrosRemaining);
      return;
    }

    const message = `Still need: ${macrosRemaining.protein}g protein, ${macrosRemaining.carbs}g carbs, ${macrosRemaining.fats}g fats`;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Macro Check-in',
            body: message,
            id: Date.now(),
            actionTypeId: 'MACRO_REMINDER',
            extra: {
              type: 'macro_reminder',
              macrosRemaining
            }
          }
        ]
      });
    } catch (error) {
      console.error('Failed to send macro reminder:', error);
    }
  }

  private generateInsightMessage(insights: DailyInsight): string {
    const messages = [];
    
    if (insights.recovery >= 75) {
      messages.push('🟢 Great recovery!');
    } else if (insights.recovery >= 50) {
      messages.push('🟡 Moderate recovery');
    } else {
      messages.push('🔴 Low recovery - rest up');
    }

    messages.push(`Today: ${insights.recommendedTraining}`);
    
    if (insights.alerts.length > 0) {
      messages.push(`⚠️ ${insights.alerts[0]}`);
    }

    return messages.join(' • ');
  }

  async setupNotificationHandlers(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Notification action performed:', notification);
        
        switch (notification.actionId) {
          case 'DAILY_INSIGHTS':
            // Open app to dashboard
            break;
          case 'WORKOUT_REMINDER':
            // Open workout tracker
            break;
          case 'RECOVERY_ALERT':
            // Open recovery details
            break;
          case 'MACRO_REMINDER':
            // Open nutrition tracker
            break;
        }
      });

      await PushNotifications.addListener('registration', (token) => {
        console.log('Push registration token:', token.value);
        // Store token for future push notifications
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error.error);
      });

    } catch (error) {
      console.error('Failed to setup notification handlers:', error);
    }
  }
}

export const notificationService = new NotificationService();