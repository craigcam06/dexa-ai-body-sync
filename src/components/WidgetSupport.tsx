import React from 'react';
import { Capacitor } from '@capacitor/core';

interface WidgetData {
  recovery: number;
  steps: number;
  workouts: number;
  lastUpdated: string;
}

class WidgetSupport {
  private static instance: WidgetSupport;

  public static getInstance(): WidgetSupport {
    if (!WidgetSupport.instance) {
      WidgetSupport.instance = new WidgetSupport();
    }
    return WidgetSupport.instance;
  }

  public isNative(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  }

  public async updateWidget(data: WidgetData): Promise<void> {
    if (!this.isNative()) {
      console.log('Widget update (web preview):', data);
      return;
    }

    try {
      // Use native iOS widget APIs when available
      if ((window as any).webkit?.messageHandlers?.widgetUpdate) {
        (window as any).webkit.messageHandlers.widgetUpdate.postMessage({
          recovery: data.recovery,
          steps: data.steps,
          workouts: data.workouts,
          lastUpdated: data.lastUpdated
        });
      }
      
      console.log('Widget updated successfully');
    } catch (error) {
      console.error('Failed to update widget:', error);
    }
  }

  public async scheduleWidgetUpdates(frequency: number): Promise<void> {
    if (!this.isNative()) {
      console.log('Widget scheduling (web preview):', frequency);
      return;
    }

    try {
      // Schedule periodic widget updates using native iOS APIs
      if ((window as any).webkit?.messageHandlers?.widgetSchedule) {
        (window as any).webkit.messageHandlers.widgetSchedule.postMessage({
          interval: frequency * 60 * 1000 // Convert minutes to milliseconds
        });
      }
      
      console.log(`Widget updates scheduled every ${frequency} minutes`);
    } catch (error) {
      console.error('Failed to schedule widget updates:', error);
    }
  }

  public async createWidgetData(): Promise<WidgetData> {
    // This would typically fetch real data from HealthKit or your database
    return {
      recovery: Math.floor(Math.random() * 100),
      steps: Math.floor(Math.random() * 15000),
      workouts: Math.floor(Math.random() * 3),
      lastUpdated: new Date().toISOString()
    };
  }

  public async enableWidgets(config: { type: string; frequency: number }): Promise<void> {
    if (!this.isNative()) {
      console.log('Widget configuration (web preview):', config);
      return;
    }

    try {
      // Configure widgets using native iOS APIs
      if ((window as any).webkit?.messageHandlers?.widgetConfigure) {
        (window as any).webkit.messageHandlers.widgetConfigure.postMessage({
          type: config.type,
          updateFrequency: config.frequency
        });
      }

      // Start periodic updates
      await this.scheduleWidgetUpdates(config.frequency);
      
      console.log('Widgets enabled with config:', config);
    } catch (error) {
      console.error('Failed to enable widgets:', error);
    }
  }

  public async disableWidgets(): Promise<void> {
    if (!this.isNative()) {
      console.log('Widgets disabled (web preview)');
      return;
    }

    try {
      // Disable widgets using native iOS APIs
      if ((window as any).webkit?.messageHandlers?.widgetDisable) {
        (window as any).webkit.messageHandlers.widgetDisable.postMessage({});
      }
      console.log('Widgets disabled');
    } catch (error) {
      console.error('Failed to disable widgets:', error);
    }
  }
}

// React hook for widget management
export const useWidgetSupport = () => {
  const widgetSupport = WidgetSupport.getInstance();

  const updateWidget = async (data: WidgetData) => {
    await widgetSupport.updateWidget(data);
  };

  const enableWidgets = async (config: { type: string; frequency: number }) => {
    await widgetSupport.enableWidgets(config);
  };

  const disableWidgets = async () => {
    await widgetSupport.disableWidgets();
  };

  const createWidgetData = async (): Promise<WidgetData> => {
    return await widgetSupport.createWidgetData();
  };

  return {
    updateWidget,
    enableWidgets,
    disableWidgets,
    createWidgetData,
    isNative: widgetSupport.isNative()
  };
};

export default WidgetSupport;