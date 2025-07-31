import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  Activity, 
  Target, 
  TrendingUp, 
  Apple, 
  Zap,
  Brain,
  Calendar,
  BarChart3,
  Settings,
  Moon,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AICoachPanel } from '@/components/AICoachPanel';
import { PlanDashboard } from '@/components/PlanDashboard';
import { WhoopConnect } from '@/components/WhoopConnect';
import { NutritionLogger } from '@/components/NutritionLogger';
import { ProgressTracker } from '@/components/ProgressTracker';
import { calculateOverallHealthScore, getMockEnergyData, getMockBodyCompositionData } from '@/utils/healthScore';
import { calculateTDEE, DEFAULT_USER_PROFILE } from '@/utils/healthMetrics';
import { ParsedWhoopData } from '@/types/whoopData';

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [whoopData, setWhoopData] = useState<ParsedWhoopData | undefined>();

  // Load Whoop data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('whoopData');
    if (savedData) {
      try {
        setWhoopData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error parsing Whoop data:', error);
      }
    }
  }, []);

  // Calculate health metrics
  const healthMetrics = useMemo(() => {
    // Calculate TDEE
    const tdeeData = calculateTDEE(
      DEFAULT_USER_PROFILE.weight,
      DEFAULT_USER_PROFILE.height,
      DEFAULT_USER_PROFILE.age,
      DEFAULT_USER_PROFILE.gender,
      whoopData?.daily,
      whoopData?.stronglifts
    );

    // Get energy and body composition data
    const energyData = getMockEnergyData(tdeeData);
    const bodyData = getMockBodyCompositionData();

    // Calculate overall health score
    const healthScore = calculateOverallHealthScore(whoopData, energyData, bodyData);

    return {
      tdeeData,
      energyData,
      bodyData,
      healthScore
    };
  }, [whoopData]);

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">HealthSync AI</h1>
                  <p className="text-sm text-muted-foreground">Your Personal Health Coach</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="hidden sm:flex">
                  <Activity className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => alert('Settings panel coming soon!')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure app preferences and data sources</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Navigation Tabs */}
            <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View your health metrics and overall score</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="plan" className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Plan</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Track progress and log nutrition</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="coach" className="flex items-center space-x-2">
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">AI Coach</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get personalized health advice</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="devices" className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">Devices</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connect health tracking devices</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="insights" className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Insights</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View AI-powered health insights</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">

              {/* Essential Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ gridAutoRows: '1fr' }}>
                {/* Overall Health Score */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                      <Heart className="w-5 h-5" />
                      <span>Overall Health Score</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-green-600 hover:text-green-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Weighted average of recovery health (40%), energy balance (35%), and body composition progress (25%)</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription className="text-green-600 dark:text-green-400">
                      Computed from recovery, energy balance & body composition
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {healthMetrics.healthScore.totalScore}/100
                    </div>
                    <Progress value={healthMetrics.healthScore.totalScore} className="mt-3" />
                    <div className="flex items-center justify-between mt-3 text-sm text-green-700 dark:text-green-300">
                      <span>Recovery: {healthMetrics.healthScore.components.recovery.score}%</span>
                      <span>Energy: {healthMetrics.energyData.actualDeficit} cal</span>
                      <span>{healthMetrics.healthScore.totalScore >= 85 ? 'Excellent' : healthMetrics.healthScore.totalScore >= 70 ? 'Good' : 'Needs attention'}</span>
                    </div>
                    {healthMetrics.healthScore.insights.length > 0 && (
                      <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                        💡 {healthMetrics.healthScore.insights[0]}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recovery Health */}
                <Collapsible open={expandedCards.recovery} onOpenChange={() => toggleCard('recovery')}>
                  <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 h-full flex flex-col">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
                        <CardTitle className="flex items-center justify-between text-blue-800 dark:text-blue-200">
                          <div className="flex items-center space-x-2">
                            <Moon className="w-5 h-5" />
                            <span>Recovery Health</span>
                          </div>
                          {expandedCards.recovery ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </CardTitle>
                        <CardDescription className="text-blue-600 dark:text-blue-400">
                          Sleep quality + recovery readiness
                        </CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700 dark:text-blue-300">Sleep Score</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {whoopData?.sleep?.[whoopData.sleep.length - 1]?.sleep_efficiency_percentage?.toFixed(0) || 'N/A'}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700 dark:text-blue-300">Recovery Score</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {whoopData?.recovery?.[whoopData.recovery.length - 1]?.recovery_score?.toFixed(0) || 'N/A'}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700 dark:text-blue-300">Sleep Duration</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {whoopData?.sleep?.[whoopData.sleep.length - 1]?.total_sleep_time_milli 
                              ? `${(whoopData.sleep[whoopData.sleep.length - 1].total_sleep_time_milli / (1000 * 60 * 60)).toFixed(1)}h`
                              : '7.5h'}
                          </span>
                        </div>
                      </div>
                      
                      <CollapsibleContent className="space-y-3 mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">HRV (RMSSD)</div>
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">42ms ↑</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Resting HR</div>
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">52 bpm</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Deep Sleep</div>
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">1h 48m</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">REM Sleep</div>
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">1h 32m</div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                          7-day trend: Recovery improving, maintain current sleep routine
                        </div>
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>

                {/* Energy Balance */}
                <Collapsible open={expandedCards.energy} onOpenChange={() => toggleCard('energy')}>
                  <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 h-full flex flex-col">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-colors">
                        <CardTitle className="flex items-center justify-between text-orange-800 dark:text-orange-200">
                          <div className="flex items-center space-x-2">
                            <Zap className="w-5 h-5" />
                            <span>Energy Balance</span>
                          </div>
                          {expandedCards.energy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </CardTitle>
                        <CardDescription className="text-orange-600 dark:text-orange-400">
                          TDEE vs intake • Daily deficit tracking
                        </CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-orange-700 dark:text-orange-300">TDEE</span>
                          <span className="text-lg font-semibold text-orange-600">
                            {healthMetrics.tdeeData.tdee.toLocaleString()} cal
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-orange-700 dark:text-orange-300">Intake</span>
                          <span className="text-lg font-semibold text-orange-600">
                            {healthMetrics.energyData.intake.toLocaleString()} cal
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-orange-700 dark:text-orange-300">Daily Deficit</span>
                          <span className={`text-lg font-semibold ${healthMetrics.energyData.actualDeficit < 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {healthMetrics.energyData.actualDeficit > 0 ? '+' : ''}{healthMetrics.energyData.actualDeficit} cal
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-orange-700 dark:text-orange-300">Activity Level</span>
                          <span className="text-sm font-medium text-orange-600">
                            {healthMetrics.tdeeData.activityLevel}
                          </span>
                        </div>
                       </div>
                      
                      <CollapsibleContent className="space-y-3 mt-4 pt-4 border-t border-orange-200 dark:border-orange-700">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">Today's Steps</div>
                            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">8,247 / 10,000</div>
                          </div>
                          <div>
                            <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">Workout Calories</div>
                            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">347 cal</div>
                          </div>
                          <div>
                            <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">Weekly Deficit</div>
                            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">-2,100 cal</div>
                          </div>
                          <div>
                            <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">Goal Progress</div>
                            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">On track</div>
                          </div>
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-3">
                          Deficit target: -300 cal/day for 0.6 lbs/week fat loss
                        </div>
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>

                {/* Body Composition Progress */}
                <Collapsible open={expandedCards.body} onOpenChange={() => toggleCard('body')}>
                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 h-full flex flex-col">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors">
                        <CardTitle className="flex items-center justify-between text-purple-800 dark:text-purple-200">
                          <div className="flex items-center space-x-2">
                            <Target className="w-5 h-5" />
                            <span>Body Composition</span>
                          </div>
                          {expandedCards.body ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </CardTitle>
                        <CardDescription className="text-purple-600 dark:text-purple-400">
                          Monthly DEXA trends • Fat loss & muscle gain
                        </CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-purple-700 dark:text-purple-300">Body Fat</span>
                          <span className="text-lg font-semibold text-purple-600">18.2% ↓</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-purple-700 dark:text-purple-300">Lean Mass</span>
                          <span className="text-lg font-semibold text-purple-600">155.3 lbs ↑</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-purple-700 dark:text-purple-300">Next DEXA</span>
                          <span className="text-lg font-semibold text-purple-600">12 days</span>
                        </div>
                      </div>
                      
                      <CollapsibleContent className="space-y-3 mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Workout Streak</div>
                            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">12 days</div>
                          </div>
                          <div>
                            <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Weekly Volume</div>
                            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">42,300 lbs</div>
                          </div>
                          <div>
                            <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Last Squat PR</div>
                            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">315 lbs</div>
                          </div>
                          <div>
                            <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Lean Mass Target</div>
                            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">160 lbs</div>
                          </div>
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-3">
                          Progress: -0.8% body fat, +2.1 lbs lean mass since last DEXA
                        </div>
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>
              </div>
            </TabsContent>

            {/* Plan Tab */}
            <TabsContent value="plan" className="space-y-6">
              <ProgressTracker />
              <NutritionLogger />
              <PlanDashboard />
            </TabsContent>

            {/* AI Coach Tab */}
            <TabsContent value="coach" className="space-y-6">
              <AICoachPanel />
            </TabsContent>

            {/* Devices Tab */}
            <TabsContent value="devices" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Apple className="w-5 h-5" />
                      <span>Apple HealthKit</span>
                    </CardTitle>
                    <CardDescription>
                      Connect your iPhone to sync health data automatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button className="w-full" onClick={() => alert('Apple HealthKit integration coming soon! This will sync weight, sleep, heart rate, and activity data.')}>
                          <Apple className="w-4 h-4 mr-2" />
                          Connect HealthKit
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Automatically sync weight, sleep, heart rate, and activity data from your iPhone</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>WHOOP Integration</span>
                    </CardTitle>
                    <CardDescription>
                      Sync your WHOOP data for advanced recovery insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WhoopConnect />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Health Insights</CardTitle>
                  <CardDescription>
                    AI-powered analysis of your health trends and patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Recovery Trend</h4>
                      <p className="text-sm text-muted-foreground">
                        Your recovery has improved 15% this week. Consider maintaining your current sleep schedule.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Training Load</h4>
                      <p className="text-sm text-muted-foreground">
                        Your training load is optimal. You can safely increase intensity by 10% next week.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Sleep Quality</h4>
                      <p className="text-sm text-muted-foreground">
                        Your deep sleep has increased 20% since reducing screen time before bed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Index;
