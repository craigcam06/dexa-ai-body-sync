import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Moon, Zap, BarChart3, Dumbbell } from 'lucide-react';
import { ParsedWhoopData } from '@/types/whoopData';

interface DataAnalyticsProps {
  whoopData?: ParsedWhoopData;
}

export function DataAnalytics({ whoopData }: DataAnalyticsProps) {
  console.log('DataAnalytics received whoopData:', whoopData);
  
  if (!whoopData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Analytics
          </CardTitle>
          <CardDescription>
            Upload your Whoop data to see detailed analytics and trends
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  // Process recovery trend data
  const recoveryTrendData = whoopData.recovery
    .slice(-30) // Last 30 days
    .map((r, index) => ({
      day: index + 1,
      recovery: r.recovery_score,
      hrv: r.hrv_rmssd_milli,
      rhr: r.resting_heart_rate,
      date: r.date
    }));

  // Process sleep efficiency data
  const sleepTrendData = whoopData.sleep
    .slice(-30)
    .map((s, index) => ({
      day: index + 1,
      efficiency: s.sleep_efficiency_percentage,
      totalSleep: s.total_sleep_time_milli / (1000 * 60 * 60), // Convert to hours
      deepSleep: s.slow_wave_sleep_time_milli / (1000 * 60), // Convert to minutes
      remSleep: s.rem_sleep_time_milli / (1000 * 60),
      date: s.date
    }));

  // Process workout strain data
  const workoutTrendData = whoopData.workouts
    .slice(-20)
    .map((w, index) => ({
      workout: index + 1,
      strain: w.strain_score,
      calories: w.kilojoule * 0.239006, // Convert kJ to calories
      avgHR: w.average_heart_rate,
      maxHR: w.max_heart_rate,
      type: w.workout_type,
      date: w.date
    }));

  // Process StrongLifts data
  const strengthProgressData = whoopData.stronglifts
    .filter(s => ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row'].includes(s.exercise))
    .reduce((acc, entry) => {
      const existing = acc.find(item => item.exercise === entry.exercise);
      if (existing) {
        existing.sessions.push({
          date: entry.date,
          weight: entry.weight,
          volume: entry.volume,
          oneRM: entry.one_rep_max || entry.weight * (1 + entry.reps / 30) // Estimate 1RM
        });
      } else {
        acc.push({
          exercise: entry.exercise,
          sessions: [{
            date: entry.date,
            weight: entry.weight,
            volume: entry.volume,
            oneRM: entry.one_rep_max || entry.weight * (1 + entry.reps / 30)
          }]
        });
      }
      return acc;
    }, [] as Array<{exercise: string, sessions: Array<{date: string, weight: number, volume: number, oneRM: number}>}>);

  // Calculate correlations and insights
  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return 0;
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  };

  const recoveryTrend = calculateTrend(recoveryTrendData.map(d => d.recovery));
  const sleepTrend = calculateTrend(sleepTrendData.map(d => d.efficiency));
  const strainTrend = calculateTrend(workoutTrendData.map(d => d.strain));
  
  // Calculate strength progression trends
  const getStrengthTrend = (exercise: string) => {
    const exerciseData = strengthProgressData.find(s => s.exercise === exercise);
    if (!exerciseData || exerciseData.sessions.length < 2) return 0;
    return calculateTrend(exerciseData.sessions.map(s => s.weight));
  };

  // Calculate averages
  const avgRecovery = recoveryTrendData.reduce((sum, d) => sum + d.recovery, 0) / recoveryTrendData.length;
  const avgSleepEfficiency = sleepTrendData.reduce((sum, d) => sum + d.efficiency, 0) / sleepTrendData.length;
  const avgStrain = workoutTrendData.reduce((sum, d) => sum + d.strain, 0) / workoutTrendData.length;
  
  // Calculate max lifts
  const getMaxLift = (exercise: string) => {
    const exerciseData = strengthProgressData.find(s => s.exercise === exercise);
    if (!exerciseData || exerciseData.sessions.length === 0) return 0;
    return Math.max(...exerciseData.sessions.map(s => s.weight));
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendBadgeColor = (trend: number) => {
    return trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recovery Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{avgRecovery.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">30-day average</p>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(recoveryTrend)}
                <Badge className={getTrendBadgeColor(recoveryTrend)}>
                  {recoveryTrend > 0 ? '+' : ''}{recoveryTrend.toFixed(2)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Sleep Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{avgSleepEfficiency.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">30-day average</p>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(sleepTrend)}
                <Badge className={getTrendBadgeColor(sleepTrend)}>
                  {sleepTrend > 0 ? '+' : ''}{sleepTrend.toFixed(2)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Training Strain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{avgStrain.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Average per workout</p>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(strainTrend)}
                <Badge className={getTrendBadgeColor(strainTrend)}>
                  {strainTrend > 0 ? '+' : ''}{strainTrend.toFixed(2)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strength Progress Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Strength Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{getMaxLift('Squat')}lbs</p>
                <p className="text-xs text-muted-foreground">Max Squat</p>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(getStrengthTrend('Squat'))}
                <Badge className={getTrendBadgeColor(getStrengthTrend('Squat'))}>
                  {getStrengthTrend('Squat') > 0 ? '+' : ''}{getStrengthTrend('Squat').toFixed(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recovery Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Recovery & HRV Trends</CardTitle>
          <CardDescription>30-day recovery score and heart rate variability</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={recoveryTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(1) : value,
                  name === 'recovery' ? 'Recovery Score (%)' : 'HRV (ms)'
                ]}
              />
              <Line yAxisId="left" type="monotone" dataKey="recovery" stroke="#8884d8" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="hrv" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sleep Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Sleep Analysis</CardTitle>
          <CardDescription>Sleep efficiency and stage distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sleepTrendData.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(1) : value,
                  name === 'efficiency' ? 'Efficiency (%)' : 
                  name === 'totalSleep' ? 'Total Sleep (h)' :
                  name === 'deepSleep' ? 'Deep Sleep (min)' : 'REM Sleep (min)'
                ]}
              />
              <Bar dataKey="efficiency" fill="#8884d8" />
              <Bar dataKey="totalSleep" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Workout Analysis */}
      {workoutTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Workout Performance</CardTitle>
            <CardDescription>Strain vs Heart Rate correlation</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workoutTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workout" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(1) : value,
                    name === 'strain' ? 'Strain Score' : 'Average HR (bpm)'
                  ]}
                />
                <Bar yAxisId="left" dataKey="strain" fill="#ff7300" />
                <Bar yAxisId="right" dataKey="avgHR" fill="#413ea0" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Strength Training Progress */}
      {whoopData.stronglifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Strength Training Progress</CardTitle>
            <CardDescription>Weight progression for main lifts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={strengthProgressData.find(s => s.exercise === 'Squat')?.sessions.slice(-20) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} lbs`,
                    name === 'weight' ? 'Working Weight' : 'Estimated 1RM'
                  ]}
                />
                <Line type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="oneRM" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Big 3 Lifts Comparison */}
      {whoopData.stronglifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Big 3 Lifts Comparison</CardTitle>
            <CardDescription>Current max weights for Squat, Bench, and Deadlift</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { exercise: 'Squat', weight: getMaxLift('Squat'), trend: getStrengthTrend('Squat') },
                { exercise: 'Bench', weight: getMaxLift('Bench Press'), trend: getStrengthTrend('Bench Press') },
                { exercise: 'Deadlift', weight: getMaxLift('Deadlift'), trend: getStrengthTrend('Deadlift') }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="exercise" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} lbs`, 'Max Weight']} />
                <Bar dataKey="weight" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
          <CardDescription>Overview of your uploaded data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{whoopData.recovery.length}</p>
              <p className="text-sm text-muted-foreground">Recovery Records</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{whoopData.sleep.length}</p>
              <p className="text-sm text-muted-foreground">Sleep Records</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{whoopData.workouts.length}</p>
              <p className="text-sm text-muted-foreground">Workouts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{whoopData.daily.length}</p>
              <p className="text-sm text-muted-foreground">Daily Records</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{whoopData.stronglifts.length}</p>
              <p className="text-sm text-muted-foreground">Strength Sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}