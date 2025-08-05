import { ParsedWhoopData, CSVParseResult, WhoopRecoveryData, WhoopSleepData, WhoopWorkoutData, WhoopDailyData, WhoopJournalData, StrongLiftsData } from '@/types/whoopData';

// Header mapping configuration with fuzzy matching
interface HeaderMapping {
  [key: string]: string[];
}

const RECOVERY_HEADERS: HeaderMapping = {
  'date': ['date', 'day', 'created_at', 'timestamp', 'cycle start time'],
  'recovery_score': ['recovery score %', 'recovery score', 'recovery %', 'recovery percentage', 'recovery', 'recovery_score'],
  'hrv_rmssd_milli': ['heart rate variability (ms)', 'hrv rmssd', 'hrv', 'heart rate variability', 'rmssd', 'hrv_rmssd_milli'],
  'resting_heart_rate': ['resting heart rate (bpm)', 'resting heart rate', 'rhr', 'rest hr', 'resting_heart_rate'],
  'skin_temp_celsius': ['skin temp (celsius)', 'skin temp', 'skin temperature', 'temp', 'skin_temp_celsius']
};

const SLEEP_HEADERS: HeaderMapping = {
  'date': ['date', 'day', 'created_at', 'timestamp', 'cycle start time', 'sleep onset'],
  'total_sleep_time_milli': ['asleep duration (min)', 'total sleep', 'sleep time', 'sleep duration', 'total_sleep_time_milli'],
  'sleep_efficiency_percentage': ['sleep efficiency %', 'sleep efficiency', 'efficiency', 'sleep_efficiency_percentage'],
  'slow_wave_sleep_time_milli': ['deep (sws) duration (min)', 'slow wave sleep', 'deep sleep', 'sws', 'slow_wave_sleep_time_milli'],
  'rem_sleep_time_milli': ['rem duration (min)', 'rem sleep', 'rem', 'rem_sleep_time_milli'],
  'light_sleep_time_milli': ['light sleep duration (min)', 'light sleep', 'light', 'light_sleep_time_milli'],
  'wake_time_milli': ['awake duration (min)', 'wake time', 'awake time', 'wake', 'wake_time_milli'],
  'sleep_score': ['sleep performance %', 'sleep score', 'sleep performance', 'sleep %', 'sleep percentage', 'sleep_score', 'sleep_performance_percentage']
};

const WORKOUT_HEADERS: HeaderMapping = {
  'date': ['date', 'day', 'created_at', 'timestamp', 'cycle start time', 'workout start time'],
  'strain_score': ['activity strain', 'strain score', 'strain', 'strain_score'],
  'kilojoule': ['energy burned (cal)', 'kilojoule', 'energy', 'kj', 'calories'],
  'average_heart_rate': ['average hr (bpm)', 'average heart rate', 'avg hr', 'avg heart rate', 'average_heart_rate'],
  'max_heart_rate': ['max hr (bpm)', 'max heart rate', 'max hr', 'peak hr', 'max_heart_rate'],
  'duration_milli': ['duration (min)', 'duration', 'workout duration', 'time', 'duration_milli'],
  'workout_type': ['activity name', 'workout type', 'activity', 'sport', 'workout_type']
};

const DAILY_HEADERS: HeaderMapping = {
  'date': ['date', 'day', 'created_at', 'timestamp'],
  'steps': ['steps', 'step count'],
  'calories_burned': ['calories burned', 'calories', 'energy burned', 'calories_burned'],
  'ambient_temperature_celsius': ['ambient temperature', 'temperature', 'temp', 'ambient_temperature_celsius']
};

export class CSVParser {
  // Store learned header mappings in localStorage
  private static readonly LEARNED_MAPPINGS_KEY = 'whoop_learned_header_mappings';
  
  static getLearnedMappings(): { [dataType: string]: { [field: string]: string[] } } {
    try {
      const stored = localStorage.getItem(this.LEARNED_MAPPINGS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
  
  static saveLearnedMapping(dataType: string, field: string, header: string) {
    try {
      const learned = this.getLearnedMappings();
      if (!learned[dataType]) learned[dataType] = {};
      if (!learned[dataType][field]) learned[dataType][field] = [];
      
      // Add the new header if it's not already in the list
      if (!learned[dataType][field].includes(header.toLowerCase())) {
        learned[dataType][field].push(header.toLowerCase());
        localStorage.setItem(this.LEARNED_MAPPINGS_KEY, JSON.stringify(learned));
        console.log(`💾 Learned new header mapping: ${dataType}.${field} = "${header}"`);
      }
    } catch (error) {
      console.warn('Failed to save learned mapping:', error);
    }
  }
  
  static getEnhancedHeaderConfig(dataType: string, baseConfig: HeaderMapping): HeaderMapping {
    const learned = this.getLearnedMappings();
    const enhanced = { ...baseConfig };
    
    // Add learned mappings to the base configuration
    if (learned[dataType]) {
      for (const [field, aliases] of Object.entries(learned[dataType])) {
        if (enhanced[field]) {
          // Merge learned aliases with existing ones
          enhanced[field] = [...new Set([...enhanced[field], ...aliases])];
        }
      }
    }
    
    console.log(`🧠 Enhanced ${dataType} headers with learned mappings:`, enhanced);
    return enhanced;
  }

  // Fuzzy string matching using Levenshtein distance
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Find best matching header using fuzzy matching
  static findBestHeaderMatch(targetField: string, availableHeaders: string[], aliases: string[]): { header: string; confidence: number } | null {
    let bestMatch = { header: '', confidence: 0 };
    
    for (const header of availableHeaders) {
      const headerLower = header.toLowerCase().trim();
      
      // Check each alias
      for (const alias of aliases) {
        const aliasLower = alias.toLowerCase().trim();
        
        // Exact match gets highest confidence
        if (headerLower === aliasLower) {
          return { header, confidence: 1.0 };
        }
        
        // Substring match gets high confidence
        if (headerLower.includes(aliasLower) || aliasLower.includes(headerLower)) {
          const confidence = Math.max(aliasLower.length / headerLower.length, headerLower.length / aliasLower.length) * 0.9;
          if (confidence > bestMatch.confidence) {
            bestMatch = { header, confidence };
          }
        }
        
        // Fuzzy match for typos/variations
        const distance = this.levenshteinDistance(headerLower, aliasLower);
        const maxLength = Math.max(headerLower.length, aliasLower.length);
        const similarity = 1 - (distance / maxLength);
        
        if (similarity > 0.7 && similarity > bestMatch.confidence) {
          bestMatch = { header, confidence: similarity };
        }
      }
    }
    
    return bestMatch.confidence > 0.6 ? bestMatch : null;
  }

  // Create header mapping for a data type with learning capability
  static createHeaderMapping(headers: string[], headerConfig: HeaderMapping, dataType: string): { [key: string]: string } {
    // Get enhanced configuration with learned mappings
    const enhancedConfig = this.getEnhancedHeaderConfig(dataType, headerConfig);
    
    const mapping: { [key: string]: string } = {};
    const unmappedHeaders: string[] = [];
    
    console.log('📊 Creating header mapping for', dataType);
    console.log('Available headers:', headers);
    console.log('Enhanced config:', enhancedConfig);
    
    for (const [targetField, aliases] of Object.entries(enhancedConfig)) {
      const match = this.findBestHeaderMatch(targetField, headers, aliases);
      
      if (match) {
        mapping[targetField] = match.header;
        console.log(`✅ Mapped "${targetField}" to "${match.header}" (confidence: ${match.confidence.toFixed(2)})`);
        
        // Learn this successful mapping for future use
        this.saveLearnedMapping(dataType, targetField, match.header);
      } else {
        console.log(`❌ Could not map "${targetField}"`);
        unmappedHeaders.push(targetField);
      }
    }
    
    if (unmappedHeaders.length > 0) {
      console.log('⚠️ Unmapped fields:', unmappedHeaders);
      console.log('💡 Available headers for manual review:', headers);
    }
    
    return mapping;
  }

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
    
    // StrongLifts indicators (check BEFORE general workout indicators)
    if (headerStr.includes('exercise') || headerStr.includes('weight') || 
        headerStr.includes('reps') || headerStr.includes('sets') ||
        headerStr.includes('volume') || headerStr.includes('1rm') ||
        (headerStr.includes('squat') && headerStr.includes('bench')) ||
        headerStr.includes('stronglifts')) {
      return 'stronglifts';
    }
    
    // Workout indicators (general Whoop workouts)
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
    const mapping = this.createHeaderMapping(headers, RECOVERY_HEADERS, 'recovery');
    
    // Match exact Whoop CSV headers (case-insensitive)
    const dateIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('cycle start time') ||
             lower.includes('date') || 
             lower.includes('day') || 
             lower.includes('time');
    });
    
    const recoveryIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('recovery score %') || 
             lower.includes('recovery score') || 
             lower.includes('recovery') || 
             lower.includes('readiness');
    });
    
    const hrvIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('heart rate variability (ms)') ||
             lower.includes('heart rate variability') ||
             lower.includes('hrv') || 
             lower.includes('rmssd') ||
             lower.includes('variability');
    });
    
    const rhrIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('resting heart rate (bpm)') ||
             lower.includes('resting heart rate') ||
             (lower.includes('resting') && lower.includes('heart')) ||
             lower.includes('rhr') ||
             lower.includes('rest hr');
    });
    
    const tempIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('skin temp (celsius)') ||
             lower.includes('skin temp') ||
             (lower.includes('temp') && 
              (lower.includes('skin') || lower.includes('body')));
    });

    console.log('🔍 Recovery column indices:', {
      date: dateIndex,
      recovery: recoveryIndex,
      hrv: hrvIndex,
      rhr: rhrIndex,
      temp: tempIndex
    });

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;

      try {
        const recoveryData = {
          date: row[dateIndex] || '',
          recovery_score: parseFloat(row[recoveryIndex]) || 0,
          hrv_rmssd_milli: parseFloat(row[hrvIndex]) || 0,
          resting_heart_rate: parseFloat(row[rhrIndex]) || 0,
          skin_temp_celsius: parseFloat(row[tempIndex]) || 0,
        };
        
        console.log(`🔍 Parsed recovery row ${i}:`, recoveryData);
        data.push(recoveryData);
      } catch (error) {
        console.warn(`Error parsing recovery row ${i}:`, error);
      }
    }
    
    console.log(`🔍 Total recovery data parsed: ${data.length} entries`);
    return data;
  }

  static parseSleepData(rows: string[][], headers: string[]): WhoopSleepData[] {
    const data: WhoopSleepData[] = [];
    const mapping = this.createHeaderMapping(headers, SLEEP_HEADERS, 'sleep');
    
    // Match exact Whoop CSV headers (case-insensitive)
    const dateIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('sleep onset') || 
             lower.includes('cycle start time') ||
             lower.includes('date') || 
             lower.includes('day');
    });
    
    const totalSleepIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('asleep duration (min)') || 
             lower.includes('asleep duration') ||
             lower.includes('total sleep') ||
             (lower.includes('total') && lower.includes('sleep'));
    });
    
    const efficiencyIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('sleep efficiency %') ||
             lower.includes('sleep efficiency');
    });
    
    const slowWaveIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('deep (sws) duration (min)') ||
             lower.includes('deep (sws) duration') || 
             lower.includes('deep') || 
             lower.includes('slow') || 
             lower.includes('sws');
    });
    
    const remIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('rem duration (min)') ||
             lower.includes('rem duration') || 
             lower.includes('rem');
    });
    
    const lightIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('light sleep duration (min)') ||
             lower.includes('light sleep duration') || 
             lower.includes('light');
    });
    
    const wakeIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('awake duration (min)') ||
             lower.includes('awake duration') || 
             lower.includes('wake') || 
             lower.includes('awake');
    });
    
    const scoreIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('sleep performance %') ||
             lower.includes('sleep performance') || 
             (lower.includes('sleep') && lower.includes('score'));
    });

    console.log('🔍 Sleep column indices:', {
      date: dateIndex,
      totalSleep: totalSleepIndex,
      efficiency: efficiencyIndex,
      slowWave: slowWaveIndex,
      rem: remIndex,
      light: lightIndex,
      wake: wakeIndex,
      score: scoreIndex
    });

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;

      try {
        const sleepData = {
          date: row[dateIndex] || '',
          total_sleep_time_milli: this.parseTimeToMillis(row[totalSleepIndex]) || 0,
          sleep_efficiency_percentage: parseFloat(row[efficiencyIndex]) || 0,
          slow_wave_sleep_time_milli: this.parseTimeToMillis(row[slowWaveIndex]) || 0,
          rem_sleep_time_milli: this.parseTimeToMillis(row[remIndex]) || 0,
          light_sleep_time_milli: this.parseTimeToMillis(row[lightIndex]) || 0,
          wake_time_milli: this.parseTimeToMillis(row[wakeIndex]) || 0,
          sleep_score: parseFloat(row[scoreIndex]) || 0,
        };
        
        console.log(`🔍 Parsed sleep row ${i}:`, sleepData);
        data.push(sleepData);
      } catch (error) {
        console.warn(`Error parsing sleep row ${i}:`, error);
      }
    }
    
    console.log(`🔍 Total sleep data parsed: ${data.length} entries`);
    return data;
  }

  static parseWorkoutData(rows: string[][], headers: string[]): WhoopWorkoutData[] {
    const data: WhoopWorkoutData[] = [];
    const mapping = this.createHeaderMapping(headers, WORKOUT_HEADERS, 'workout');
    
    // Match exact Whoop CSV headers (case-insensitive)
    const dateIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('workout start time') || 
             lower.includes('cycle start time') ||
             lower.includes('date') || 
             lower.includes('day');
    });
    
    const strainIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('activity strain') || lower.includes('strain');
    });
    
    const caloriesIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('energy burned') || 
             lower.includes('calorie') || 
             lower.includes('kilojoule');
    });
    
    const avgHrIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('average hr') || 
             (lower.includes('average') && lower.includes('heart'));
    });
    
    const maxHrIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('max hr') || 
             (lower.includes('max') && lower.includes('heart'));
    });
    
    const durationIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('duration') || lower.includes('time');
    });
    
    const typeIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('activity name') || 
             lower.includes('type') || 
             lower.includes('activity');
    });

    console.log('🔍 Workout column indices:', {
      date: dateIndex,
      strain: strainIndex, 
      calories: caloriesIndex,
      avgHr: avgHrIndex,
      maxHr: maxHrIndex,
      duration: durationIndex,
      type: typeIndex
    });

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;

      try {
        const workoutData = {
          date: row[dateIndex] || '',
          strain_score: parseFloat(row[strainIndex]) || 0,
          kilojoule: parseFloat(row[caloriesIndex]) || 0,
          average_heart_rate: parseFloat(row[avgHrIndex]) || 0,
          max_heart_rate: parseFloat(row[maxHrIndex]) || 0,
          duration_milli: this.parseTimeToMillis(row[durationIndex]) || 0,
          workout_type: row[typeIndex] || '',
        };
        
        console.log(`🔍 Parsed workout row ${i}:`, workoutData);
        data.push(workoutData);
      } catch (error) {
        console.warn(`Error parsing workout row ${i}:`, error);
      }
    }
    
    console.log(`🔍 Total workout data parsed: ${data.length} entries`);
    return data;
  }

  static parseDailyData(rows: string[][], headers: string[]): WhoopDailyData[] {
    const data: WhoopDailyData[] = [];
    const mapping = this.createHeaderMapping(headers, DAILY_HEADERS, 'daily');
    
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
    
    console.log('Parsing StrongLifts data. Headers:', headers);
    
    // Match exact StrongLifts column names
    const dateIndex = headers.findIndex(h => 
      h.toLowerCase().includes('date (yyyy/mm/dd)') ||
      h.toLowerCase().includes('date') || 
      h.toLowerCase().includes('day') ||
      h.toLowerCase().includes('time')
    );
    const exerciseIndex = headers.findIndex(h => 
      h.toLowerCase().includes('exercise') || 
      h.toLowerCase().includes('workout name') ||
      h.toLowerCase().includes('name')
    );
    const weightIndex = headers.findIndex(h => 
      h.toLowerCase().includes('body weight (lb)') ||
      h.toLowerCase().includes('top set (reps×lb)') ||
      h.toLowerCase().includes('weight') || 
      h.toLowerCase().includes('load')
    );
    const repsIndex = headers.findIndex(h => 
      h.toLowerCase().includes('reps') && !h.toLowerCase().includes('sets') ||
      h.toLowerCase().includes('repetitions')
    );
    const setsIndex = headers.findIndex(h => 
      h.toLowerCase().includes('sets×reps') ||
      h.toLowerCase().includes('sets')
    );
    const volumeIndex = headers.findIndex(h => 
      h.toLowerCase().includes('volume (lb)') ||
      h.toLowerCase().includes('workout volume (lb)') ||
      h.toLowerCase().includes('volume') || 
      h.toLowerCase().includes('total')
    );
    const oneRMIndex = headers.findIndex(h => 
      h.toLowerCase().includes('e1rm (lb)') ||
      h.toLowerCase().includes('1rm') || 
      h.toLowerCase().includes('one rep max')
    );
    const durationIndex = headers.findIndex(h => 
      h.toLowerCase().includes('duration (hours)') ||
      h.toLowerCase().includes('duration') || 
      h.toLowerCase().includes('time')
    );

    console.log('StrongLifts column indices:', {
      date: dateIndex,
      exercise: exerciseIndex,
      weight: weightIndex,
      reps: repsIndex,
      sets: setsIndex,
      volume: volumeIndex,
      oneRM: oneRMIndex,
      duration: durationIndex
    });

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;

      try {
        // Parse the data using the specific StrongLifts format
        let weight = 0;
        let reps = 0;
        let sets = 1; // Default to 1 set
        let volume = 0;

        // Handle different weight formats
        if (weightIndex >= 0) {
          const weightStr = row[weightIndex];
          if (weightStr.includes('×')) {
            // Format like "5×225" (reps×weight)
            const parts = weightStr.split('×');
            if (parts.length === 2) {
              reps = parseInt(parts[0]) || 0;
              weight = parseFloat(parts[1]) || 0;
            }
          } else {
            weight = parseFloat(weightStr) || 0;
          }
        }

        // Handle reps if not already parsed from weight field
        if (repsIndex >= 0 && reps === 0) {
          reps = parseInt(row[repsIndex]) || 0;
        }

        // Handle sets×reps format
        if (setsIndex >= 0) {
          const setsStr = row[setsIndex];
          if (setsStr.includes('×')) {
            const parts = setsStr.split('×');
            if (parts.length === 2) {
              sets = parseInt(parts[0]) || 1;
              if (reps === 0) reps = parseInt(parts[1]) || 0;
            }
          } else {
            sets = parseInt(setsStr) || 1;
          }
        }

        // Calculate volume if not provided
        volume = parseFloat(row[volumeIndex]) || 0;
        if (!volume && weight && reps && sets) {
          volume = weight * reps * sets;
        }

        const entry = {
          date: row[dateIndex] || '',
          exercise: row[exerciseIndex] || '',
          weight: weight,
          reps: reps,
          sets: sets,
          volume: volume,
          one_rep_max: parseFloat(row[oneRMIndex]) || undefined,
          workout_duration: this.parseTimeToMillis(row[durationIndex]) || undefined,
        };

        console.log(`StrongLifts row ${i}:`, entry);
        data.push(entry);
      } catch (error) {
        console.warn(`Error parsing StrongLifts row ${i}:`, error);
      }
    }
    
    console.log('Parsed StrongLifts data:', data.length, 'entries');
    return data;
  }

  static parseTimeToMillis(timeStr: string): number {
    if (!timeStr) return 0;
    
    console.log('🔍 Parsing time string:', timeStr);
    
    // Handle different time formats
    if (timeStr.includes(':')) {
      // Format: HH:MM:SS or MM:SS
      const parts = timeStr.split(':').map(p => parseInt(p) || 0);
      if (parts.length === 3) {
        const millis = (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
        console.log('🔍 Converted HH:MM:SS to millis:', millis);
        return millis;
      } else if (parts.length === 2) {
        const millis = (parts[0] * 60 + parts[1]) * 1000;
        console.log('🔍 Converted MM:SS to millis:', millis);
        return millis;
      }
    }
    
    // Parse as number (assume minutes for Whoop data)
    const num = parseFloat(timeStr);
    if (!isNaN(num)) {
      // For Whoop CSV, duration values are in minutes
      const millis = num * 60 * 1000;
      console.log('🔍 Converted minutes to millis:', timeStr, '->', millis);
      return millis;
    }
    
    console.log('🔍 Could not parse time string:', timeStr);
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
      console.log('🔍 CSV Headers found:', headers);
      console.log('🔍 Total rows in CSV:', rows.length);
      
      const dataType = this.detectDataType(headers);
      console.log('🔍 Detected data type:', dataType);
      
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