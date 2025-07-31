import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Moon
} from 'lucide-react';
import { AICoachPanel } from '@/components/AICoachPanel';
import { PlanDashboard } from '@/components/PlanDashboard';
import { WhoopConnect } from '@/components/WhoopConnect';

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
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
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="coach" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">AI Coach</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Devices</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Quick Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recovery Score</CardTitle>
                  <Heart className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">85%</div>
                  <p className="text-xs text-muted-foreground">+5% from yesterday</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sleep Score</CardTitle>
                  <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">7.5h</div>
                  <p className="text-xs text-muted-foreground">Target: 8h</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Steps</CardTitle>
                  <Target className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">8,247</div>
                  <p className="text-xs text-muted-foreground">Goal: 10,000</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Workout Streak</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">12 days</div>
                  <p className="text-xs text-muted-foreground">Personal best!</p>
                </CardContent>
              </Card>
            </div>

            {/* Essential Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Health Score */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                    <Heart className="w-5 h-5" />
                    <span>Overall Health Score</span>
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-400">
                    Computed from recovery, energy balance & body composition
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600 mb-2">87/100</div>
                  <Progress value={87} className="mt-3" />
                  <div className="flex items-center justify-between mt-3 text-sm text-green-700 dark:text-green-300">
                    <span>Recovery: 85%</span>
                    <span>Energy: -300 cal</span>
                    <span>On track</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recovery Health */}
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                    <Moon className="w-5 h-5" />
                    <span>Recovery Health</span>
                  </CardTitle>
                  <CardDescription className="text-blue-600 dark:text-blue-400">
                    Sleep quality + recovery readiness
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700 dark:text-blue-300">Sleep Score</span>
                      <span className="text-lg font-semibold text-blue-600">85%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700 dark:text-blue-300">Recovery Score</span>
                      <span className="text-lg font-semibold text-blue-600">78%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700 dark:text-blue-300">Sleep Duration</span>
                      <span className="text-lg font-semibold text-blue-600">7.5h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Energy Balance */}
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
                    <Zap className="w-5 h-5" />
                    <span>Energy Balance</span>
                  </CardTitle>
                  <CardDescription className="text-orange-600 dark:text-orange-400">
                    TDEE vs intake • Daily deficit tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-700 dark:text-orange-300">TDEE</span>
                      <span className="text-lg font-semibold text-orange-600">2,847 cal</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-700 dark:text-orange-300">Intake</span>
                      <span className="text-lg font-semibold text-orange-600">2,547 cal</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-700 dark:text-orange-300">Daily Deficit</span>
                      <span className="text-lg font-semibold text-green-600">-300 cal</span>
                    </div>
                    <Badge variant="secondary" className="mt-2">Connect MyFitnessPal</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Body Composition Progress */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-purple-800 dark:text-purple-200">
                    <Target className="w-5 h-5" />
                    <span>Body Composition</span>
                  </CardTitle>
                  <CardDescription className="text-purple-600 dark:text-purple-400">
                    Monthly DEXA trends • Fat loss & muscle gain
                  </CardDescription>
                </CardHeader>
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan" className="space-y-6">
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
                  <Button className="w-full">
                    <Apple className="w-4 h-4 mr-2" />
                    Connect HealthKit
                  </Button>
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
  );
};

export default Index;
