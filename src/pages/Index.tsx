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
  Info,
  ChevronDownIcon
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AICoachPanel } from '@/components/AICoachPanel';
import { PlanDashboard } from '@/components/PlanDashboard';
import { WhoopConnect } from '@/components/WhoopConnect';
import { NutritionLogger } from '@/components/NutritionLogger';
import { ProgressTracker } from '@/components/ProgressTracker';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SmartLoading } from '@/components/ui/smart-loading';
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
                  <h1 className="text-xl font-display tracking-tight">HealthSync AI</h1>
                  <p className="text-sm text-muted-foreground font-medium">Your Personal Health Coach</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="hidden sm:flex items-center">
                  <Activity className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
                <div className="flex items-center space-x-2">
                  <ThemeToggle />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="btn-interactive" onClick={() => alert('Settings panel coming soon!')}>
                        <Settings className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Settings</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Configure app preferences and data sources</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Navigation Tabs - Enhanced with Visual Hierarchy */}
            <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5 bg-card/50 backdrop-blur-sm border">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="dashboard" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Dashboard</span>
                    {activeTab === "dashboard" && <div className="w-1 h-1 bg-current rounded-full ml-1" />}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">Health Overview</p>
                  <p className="text-xs text-muted-foreground">View your health metrics and overall score</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="plan" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200">
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Plan</span>
                    {activeTab === "plan" && <div className="w-1 h-1 bg-current rounded-full ml-1" />}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">Goal Tracking</p>
                  <p className="text-xs text-muted-foreground">Track progress and log nutrition</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="coach" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200">
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">AI Coach</span>
                    {activeTab === "coach" && <div className="w-1 h-1 bg-current rounded-full ml-1" />}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">Personal Assistant</p>
                  <p className="text-xs text-muted-foreground">Get personalized health advice</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="devices" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200">
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Devices</span>
                    {activeTab === "devices" && <div className="w-1 h-1 bg-current rounded-full ml-1" />}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">Device Integration</p>
                  <p className="text-xs text-muted-foreground">Connect health tracking devices</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="insights" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200">
                    <TrendingUp className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Insights</span>
                    {activeTab === "insights" && <div className="w-1 h-1 bg-current rounded-full ml-1" />}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">AI Analysis</p>
                  <p className="text-xs text-muted-foreground">View AI-powered health insights</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>

            {/* Dashboard Tab - Enhanced with Smart Onboarding */}
            <TabsContent value="dashboard" className="space-y-6">
              
              {/* Smart Help Banner for New Users */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">Quick Start Guide</h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 leading-relaxed">
                        Connect your devices in the <strong>Devices</strong> tab → Set goals in <strong>Plan</strong> → Get insights from your <strong>AI Coach</strong>
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-2">
                      <span className="text-xs">Got it</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Essential Metrics Grid - Enhanced with Smart Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ gridAutoRows: '1fr' }}>
                {/* Overall Health Score - Enhanced */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 h-full flex flex-col card-interactive animate-fade-in-stagger relative" style={{ animationDelay: '0ms' }}>
                  {/* Smart Status Indicator */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                      <Heart className="w-5 h-5" />
                      <span>Overall Health Score</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-green-600 hover:text-green-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-2">
                            <p className="font-medium">How it's calculated:</p>
                            <div className="text-xs space-y-1">
                              <div>• Recovery health (40%)</div>
                              <div>• Energy balance (35%)</div>
                              <div>• Body composition (25%)</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Higher scores indicate better overall health trends</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription className="text-green-600 dark:text-green-400">
                      Your comprehensive wellness indicator
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-bold text-green-600">
                          {healthMetrics.healthScore.totalScore}
                        </div>
                        <div className="text-sm text-green-600/70 font-medium">/100</div>
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ml-auto ${
                          healthMetrics.healthScore.totalScore >= 85 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                            : healthMetrics.healthScore.totalScore >= 70 
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {healthMetrics.healthScore.totalScore >= 85 ? 'Excellent' : healthMetrics.healthScore.totalScore >= 70 ? 'Good' : 'Needs attention'}
                        </div>
                      </div>
                      <Progress value={healthMetrics.healthScore.totalScore} className="mt-3 transition-all duration-700 ease-out h-3" />
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center p-2 bg-green-100/50 dark:bg-green-900/20 rounded cursor-help">
                              <div className="font-medium text-green-700 dark:text-green-300">{healthMetrics.healthScore.components.recovery.score}%</div>
                              <div className="text-green-600 dark:text-green-400">Recovery</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Sleep quality and recovery readiness</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center p-2 bg-green-100/50 dark:bg-green-900/20 rounded cursor-help">
                              <div className="font-medium text-green-700 dark:text-green-300">{Math.abs(healthMetrics.energyData.actualDeficit)}</div>
                              <div className="text-green-600 dark:text-green-400">Cal Balance</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Daily calorie deficit/surplus</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center p-2 bg-green-100/50 dark:bg-green-900/20 rounded cursor-help">
                              <div className="font-medium text-green-700 dark:text-green-300">{healthMetrics.healthScore.components.bodyComposition.score}%</div>
                              <div className="text-green-600 dark:text-green-400">Body Comp</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Body composition progress</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    {healthMetrics.healthScore.insights.length > 0 && (
                      <div className="mt-4 p-3 bg-green-100/50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                        <div className="flex items-start gap-2">
                          <div className="text-sm">💡</div>
                          <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                            {healthMetrics.healthScore.insights[0]}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recovery Health */}
                <Collapsible open={expandedCards.recovery} onOpenChange={() => toggleCard('recovery')}>
                  <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 h-full flex flex-col card-interactive animate-fade-in-stagger" style={{ animationDelay: '100ms' }}>
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
                    <CardContent className="flex-1">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700 dark:text-blue-300">Sleep Score</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {(whoopData as any)?.sleep?.[0]?.efficiency || 'N/A'}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700 dark:text-blue-300">Recovery Score</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {(whoopData as any)?.recovery?.[0]?.score || 'N/A'}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700 dark:text-blue-300">Sleep Duration</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {(whoopData as any)?.sleep?.[0]?.duration_hours?.toFixed(1) || '7.5'}h
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
                  <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 h-full flex flex-col card-interactive animate-fade-in-stagger" style={{ animationDelay: '200ms' }}>
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
                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 h-full flex flex-col card-interactive animate-fade-in-stagger" style={{ animationDelay: '300ms' }}>
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
                        <Button className="w-full btn-interactive" onClick={() => alert('Apple HealthKit integration coming soon! This will sync weight, sleep, heart rate, and activity data.')}>
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

                {/* WHOOP Integration - Enhanced */}
                <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-primary" />
                        <span>WHOOP</span>
                      </div>
                      <Badge variant="outline" className="text-primary border-primary">Premium</Badge>
                    </CardTitle>
                    <CardDescription>
                      Advanced recovery & performance insights
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                        <span className="text-xs text-muted-foreground">Ready to connect</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Recovery score & HRV trends</div>
                      <div>• Sleep stages & efficiency</div>
                      <div>• Strain & workout detection</div>
                      <div>• Heart rate zones</div>
                    </div>
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
                    Key recommendations based on your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Essential Insight - Always Visible */}
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <h4 className="font-medium mb-2 text-green-700 dark:text-green-300">📈 Key Trend</h4>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Your recovery has improved 15% this week. Consider maintaining your current sleep schedule.
                      </p>
                    </div>
                    
                    {/* Progressive Disclosure for Additional Insights */}
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full group transition-all duration-200 hover:bg-card/50"
                        >
                          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            View detailed insights & recommendations
                          </span>
                          <ChevronDownIcon className="h-4 w-4 ml-2 transition-transform group-data-[state=open]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 animate-fade-in">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-300">💪 Training Load</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Your training load is optimal. You can safely increase intensity by 10% next week.
                          </p>
                        </div>
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                          <h4 className="font-medium mb-2 text-purple-700 dark:text-purple-300">😴 Sleep Quality</h4>
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            Your deep sleep has increased 20% since reducing screen time before bed.
                          </p>
                        </div>
                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <h4 className="font-medium mb-2 text-orange-700 dark:text-orange-300">🎯 Nutrition</h4>
                          <p className="text-sm text-orange-600 dark:text-orange-400">
                            Consider increasing protein intake to 1.2g/lb to optimize lean mass gains.
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
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
