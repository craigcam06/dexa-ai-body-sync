import { ParsedWhoopData, CSVParseResult, WhoopRecoveryData, WhoopSleepData, WhoopWorkoutData, WhoopDailyData, WhoopJournalData, StrongLiftsData } from '@/types/whoopData';

export class CSVParser {
  static parseCSV(csvText: string): string[][] {
    const lines = csvText.trim().split('\n');
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  }

  static detectDataType(headers: string[]): 'recovery' | 'sleep' | 'workout' | 'daily' | 'journal' | 'stronglifts' | 'unknown' {
    const headerStr = headers.join(',').toLowerCase();
    
    // Recovery indicators (including comprehensive physiological data)
    if (headerStr.includes('recovery') || headerStr.includes('hrv') || 
        headerStr.includes('resting heart rate') || headerStr.includes('rhr') ||
        headerStr.includes('readiness') || headerStr.includes('recovery score') ||
        headerStr.includes('heart rate variability') || headerStr.includes('skin temp')) {
      return 'recovery';
    }
    
    // Sleep indicators  
    if (headerStr.includes('sleep') || headerStr.includes('bed time') || 
        headerStr.includes('wake time') || headerStr.includes('sleep efficiency') ||
        headerStr.includes('rem') || headerStr.includes('deep sleep') ||
        headerStr.includes('light sleep') || headerStr.includes('total sleep')) {
      return 'sleep';
    }
    
    // Workout indicators
    if (headerStr.includes('strain') || headerStr.includes('workout') || 
        headerStr.includes('activity') || headerStr.includes('exercise') ||
        headerStr.includes('kilojoule') || headerStr.includes('max heart rate') ||
        headerStr.includes('average heart rate') || headerStr.includes('calories burned')) {
      return 'workout';
    }
    
    // Daily/general indicators
    if (headerStr.includes('steps') || headerStr.includes('daily') ||
        headerStr.includes('ambient') || headerStr.includes('temperature') ||
        headerStr.includes('day strain') || headerStr.includes('calories')) {
      return 'daily';
    }
    
    // StrongLifts indicators
    if (headerStr.includes('exercise') || headerStr.includes('weight') || 
        headerStr.includes('reps') || headerStr.includes('sets') ||
        headerStr.includes('volume') || headerStr.includes('1rm') ||
        (headerStr.includes('squat') && headerStr.includes('bench')) ||
        headerStr.includes('stronglifts')) {
      return 'stronglifts';
    }
    
    // Journal indicators
    if (headerStr.includes('journal') || headerStr.includes('question text') || 
        headerStr.includes('answered yes') || headerStr.includes('notes') ||
        (headerStr.includes('question') && headerStr.includes('answer'))) {
      return 'journal';
    }
    
    // If we can't detect, let's be more lenient and try to parse as daily data
    console.log('Could not detect data type from headers:', headers);
    return 'unknown';
  }

  static parseRecoveryData(rows: string[][], headers: string[]): WhoopRecoveryData[] {
    const data: WhoopRecoveryData[] = [];
    
    // More flexible header matching for physiological data
    const dateIndex = headers.findIndex(h => 
      h.toLowerCase().includes('cycle start time') ||
      h.toLowerCase().includes('date') || 
      h.toLowerCase().includes('day') || 
      h.toLowerCase().includes('time')
    );
    const recoveryIndex = headers.findIndex(h => 
      h.toLowerCase().includes('recovery score') || 
      h.toLowerCase().includes('recovery') || 
      h.toLowerCase().includes('readiness')
    );
    const hrvIndex = headers.findIndex(h => 
      h.toLowerCase().includes('heart rate variability') ||
      h.toLowerCase().includes('hrv') || 
      h.toLowerCase().includes('rmssd') ||
      h.toLowerCase().includes('variability')
    );
    const rhrIndex = headers.findIndex(h => 
      h.toLowerCase().includes('resting heart rate') ||
      (h.toLowerCase().includes('resting') && h.toLowerCase().includes('heart')) ||
      h.toLowerCase().includes('rhr') ||
      h.toLowerCase().includes('rest hr')
    );
    const tempIndex = headers.findIndex(h => 
      h.toLowerCase().includes('skin temp') ||
      h.toLowerCase().includes('temp') && 
      (h.toLowerCase().includes('skin') || h.toLowerCase().includes('body'))
    );

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;

      try {
        data.push({
          date: row[dateIndex] || '',
          recovery_score: parseFloat(row[recoveryIndex]) || 0,
          hrv_rmssd_milli: parseFloat(row[hrvIndex]) || 0,
          resting_heart_rate: parseFloat(row[rhrIndex]) || 0,
          skin_temp_celsius: parseFloat(row[tempIndex]) || 0,
        });
      } catch (error) {
        console.warn(`Error parsing recovery row ${i}:`, error);
      }
    }
    
    return data;
  }

  static parseSleepData(rows: string[][], headers: string[]): WhoopSleepData[] {
    const data: WhoopSleepData[] = [];
    
    // Match exact Whoop CSV headers
    const dateIndex = headers.findIndex(h => 
      h.toLowerCase().includes('sleep onset') || 
      h.toLowerCase().includes('cycle start time') ||
      h.toLowerCase().includes('date') || 
      h.toLowerCase().includes('day')
    );
    const totalSleepIndex = headers.findIndex(h => 
      h.toLowerCase().includes('asleep duration') || 
      h.toLowerCase().includes('total sleep') ||
      h.toLowerCase().includes('total') && h.toLowerCase().includes('sleep')
    );
    const efficiencyIndex = headers.findIndex(h => h.toLowerCase().includes('sleep efficiency'));
    const slowWaveIndex = headers.findIndex(h => 
      h.toLowerCase().includes('deep (sws) duration') || 
      h.toLowerCase().includes('deep') || 
      h.toLowerCase().includes('slow') || 
      h.toLowerCase().includes('sws')
    );
    const remIndex = headers.findIndex(h => h.toLowerCase().includes('rem duration') || h.toLowerCase().includes('rem'));
    const lightIndex = headers.findIndex(h => h.toLowerCase().includes('light sleep duration') || h.toLowerCase().includes('light'));
    const wakeIndex = headers.findIndex(h => h.toLowerCase().includes('awake duration') || h.toLowerCase().includes('wake') || h.toLowerCase().includes('awake'));
    const scoreIndex = headers.findIndex(h => 
      h.toLowerCase().includes('sleep performance') || 
      (h.toLowerCase().includes('sleep') && h.toLowerCase().includes('score'))
    );

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;

      try {
        data.push({
          date: row[dateIndex] || '',
          total_sleep_time_milli: this.parseTimeToMillis(row[totalSleepIndex]) || 0,
          sleep_efficiency_percentage: parseFloat(row[efficiencyIndex]) || 0,
          slow_wave_sleep_time_milli: this.parseTimeToMillis(row[slowWaveIndex]) || 0,
          rem_sleep_time_milli: this.parseTimeToMillis(row[remIndex]) || 0,
          light_sleep_time_milli: this.parseTimeToMillis(row[lightIndex]) || 0,
          wake_time_milli: this.parseTimeToMillis(row[wakeIndex]) || 0,
          sleep_score: parseFloat(row[scoreIndex]) || 0,
        });
      } catch (error) {
        console.warn(`Error parsing sleep row ${i}:`, error);
      }
    }
    
    return data;
  }

  static parseWorkoutData(rows: string[][], headers: string[]): WhoopWorkoutData[] {
    const data: WhoopWorkoutData[] = [];
    
    // Match exact Whoop CSV headers
    const dateIndex = headers.findIndex(h => 
      h.toLowerCase().includes('workout start time') || 
      h.toLowerCase().includes('cycle start time') ||
      h.toLowerCase().includes('date') || 
      h.toLowerCase().includes('day')
    );
    const strainIndex = headers.findIndex(h => h.toLowerCase().includes('activity strain') || h.toLowerCase().includes('strain'));
    const caloriesIndex = headers.findIndex(h => 
      h.toLowerCase().includes('energy burned') || 
      h.toLowerCase().includes('calorie') || 
      h.toLowerCase().includes('kilojoule')
    );
    const avgHrIndex = headers.findIndex(h => h.toLowerCase().includes('average hr') || (h.toLowerCase().includes('average') && h.toLowerCase().includes('heart')));
    const maxHrIndex = headers.findIndex(h => h.toLowerCase().includes('max hr') || (h.toLowerCase().includes('max') && h.toLowerCase().includes('heart')));
    const durationIndex = headers.findIndex(h => h.toLowerCase().includes('duration') || h.toLowerCase().includes('time'));
    const typeIndex = headers.findIndex(h => h.toLowerCase().includes('activity name') || h.toLowerCase().includes('type') || h.toLowerCase().includes('activity'));

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;

      try {
        data.push({
          date: row[dateIndex] || '',
          strain_score: parseFloat(row[strainIndex]) || 0,
          kilojoule: parseFloat(row[caloriesIndex]) || 0,
          average_heart_rate: parseFloat(row[avgHrIndex]) || 0,
          max_heart_rate: parseFloat(row[maxHrIndex]) || 0,
          duration_milli: this.parseTimeToMillis(row[durationIndex]) || 0,
          workout_type: row[typeIndex] || '',
        });
      } catch (error) {
        console.warn(`Error parsing workout row ${i}:`, error);
      }
    }
    
    return data;
  }

  static parseDailyData(rows: string[][], headers: string[]): WhoopDailyData[] {
    const data: WhoopDailyData[] = [];
    
    const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('day'));
    const stepsIndex = headers.findIndex(h => h.toLowerCase().includes('steps'));
    const caloriesIndex = headers.findIndex(h => h.toLowerCase().includes('calories') && h.toLowerCase().includes('burned'));
    const tempIndex = headers.findIndex(h => h.toLowerCase().includes('ambient') || h.toLowerCase().includes('temperature'));

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;

      try {
        data.push({
          date: row[dateIndex] || '',
          steps: parseInt(row[stepsIndex]) || 0,
          calories_burned: parseFloat(row[caloriesIndex]) || 0,
          ambient_temperature_celsius: parseFloat(row[tempIndex]) || 0,
        });
      } catch (error) {
        console.warn(`Error parsing daily row ${i}:`, error);
      }
    }
    
    return data;
  }

  static parseJournalData(rows: string[][], headers: string[]): WhoopJournalData[] {
    const data: WhoopJournalData[] = [];
    
    const dateIndex = headers.findIndex(h => 
      h.toLowerCase().includes('cycle start time') ||
      h.toLowerCase().includes('date') || 
      h.toLowerCase().includes('day')
    );
    const questionIndex = headers.findIndex(h => h.toLowerCase().includes('question text'));
    const answeredIndex = headers.findIndex(h => h.toLowerCase().includes('answered yes'));
    const notesIndex = headers.findIndex(h => h.toLowerCase().includes('notes'));

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;

      try {
        data.push({
          date: row[dateIndex] || '',
          question_text: row[questionIndex] || '',
          answered_yes: row[answeredIndex]?.toLowerCase() === 'true' || row[answeredIndex] === '1',
          notes: row[notesIndex] || '',
        });
      } catch (error) {
        console.warn(`Error parsing journal row ${i}:`, error);
      }
    }
    
    return data;
  }

  static parseStrongLiftsData(rows: string[][], headers: string[]): StrongLiftsData[] {
    const data: StrongLiftsData[] = [];
    
    const dateIndex = headers.findIndex(h => 
      h.toLowerCase().includes('date') || 
      h.toLowerCase().includes('day') ||
      h.toLowerCase().includes('time')
    );
    const exerciseIndex = headers.findIndex(h => h.toLowerCase().includes('exercise') || h.toLowerCase().includes('name'));
    const weightIndex = headers.findIndex(h => h.toLowerCase().includes('weight') || h.toLowerCase().includes('load'));
    const repsIndex = headers.findIndex(h => h.toLowerCase().includes('reps') || h.toLowerCase().includes('repetitions'));
    const setsIndex = headers.findIndex(h => h.toLowerCase().includes('sets'));
    const volumeIndex = headers.findIndex(h => h.toLowerCase().includes('volume') || h.toLowerCase().includes('total'));
    const oneRMIndex = headers.findIndex(h => h.toLowerCase().includes('1rm') || h.toLowerCase().includes('one rep max'));
    const durationIndex = headers.findIndex(h => h.toLowerCase().includes('duration') || h.toLowerCase().includes('time'));

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;

      try {
        // Calculate volume if not provided
        let volume = parseFloat(row[volumeIndex]) || 0;
        const weight = parseFloat(row[weightIndex]) || 0;
        const reps = parseInt(row[repsIndex]) || 0;
        const sets = parseInt(row[setsIndex]) || 0;
        
        if (!volume && weight && reps && sets) {
          volume = weight * reps * sets;
        }

        data.push({
          date: row[dateIndex] || '',
          exercise: row[exerciseIndex] || '',
          weight: weight,
          reps: reps,
          sets: sets,
          volume: volume,
          one_rep_max: parseFloat(row[oneRMIndex]) || undefined,
          workout_duration: this.parseTimeToMillis(row[durationIndex]) || undefined,
        });
      } catch (error) {
        console.warn(`Error parsing StrongLifts row ${i}:`, error);
      }
    }
    
    return data;
  }

  static parseTimeToMillis(timeStr: string): number {
    if (!timeStr) return 0;
    
    // Handle different time formats
    if (timeStr.includes(':')) {
      // Format: HH:MM:SS or MM:SS
      const parts = timeStr.split(':').map(p => parseInt(p) || 0);
      if (parts.length === 3) {
        return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
      } else if (parts.length === 2) {
        return (parts[0] * 60 + parts[1]) * 1000;
      }
    }
    
    // Try to parse as decimal hours or minutes
    const num = parseFloat(timeStr);
    if (!isNaN(num)) {
      // Assume hours if > 24, minutes if reasonable range
      if (num > 24) {
        return num * 60 * 1000; // Assume minutes
      } else {
        return num * 3600 * 1000; // Assume hours
      }
    }
    
    return 0;
  }

  static async parseWhoopCSV(file: File): Promise<CSVParseResult> {
    try {
      const csvText = await file.text();
      const rows = this.parseCSV(csvText);
      
      if (rows.length < 2) {
        return {
          success: false,
          error: 'CSV file must contain at least a header row and one data row'
        };
      }

      const headers = rows[0];
      console.log('CSV Headers found:', headers);
      
      const dataType = this.detectDataType(headers);
      console.log('Detected data type:', dataType);
      
      if (dataType === 'unknown') {
        return {
          success: false,
          error: `Could not detect data type from headers: ${headers.join(', ')}. Expected Whoop data with headers like 'Recovery Score', 'Sleep Efficiency', 'Strain Score', or 'Steps'.`
        };
      }

      const result: ParsedWhoopData = {
        recovery: [],
        sleep: [],
        workouts: [],
        daily: [],
        journal: [],
        stronglifts: []
      };

      switch (dataType) {
        case 'recovery':
          result.recovery = this.parseRecoveryData(rows, headers);
          break;
        case 'sleep':
          result.sleep = this.parseSleepData(rows, headers);
          break;
        case 'workout':
          result.workouts = this.parseWorkoutData(rows, headers);
          break;
        case 'daily':
          result.daily = this.parseDailyData(rows, headers);
          break;
        case 'journal':
          result.journal = this.parseJournalData(rows, headers);
          break;
        case 'stronglifts':
          result.stronglifts = this.parseStrongLiftsData(rows, headers);
          break;
      }

      return {
        success: true,
        data: result,
        rowsProcessed: rows.length - 1
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse CSV file'
      };
    }
  }
}