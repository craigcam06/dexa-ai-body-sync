import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Activity, 
  Brain, 
  Heart, 
  TrendingUp, 
  Zap, 
  Apple,
  Dumbbell,
  Target,
  MessageSquare,
  Settings,
  Flame,
  Calendar,
  Sparkles,
  Bell,
  Mic,
  Upload,
  CheckCircle,
  Info,
  HelpCircle
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { BodyCompositionChart } from "./BodyCompositionChart";
import { UnifiedHealthInsights } from "./UnifiedHealthInsights";
import { WhoopConnect } from "./WhoopConnect";
import { AppleHealthConnect } from "./AppleHealthConnect";
import { GoalSetting } from "./GoalSetting";
import { AICoachPanel } from "./AICoachPanel";
import { VoiceInterface } from "./VoiceInterface";
import { PlanSetup } from "./PlanSetup";
import { PlanDashboard } from "./PlanDashboard";
import { MobileHealthSync } from "./MobileHealthSync";
import { calculateTDEE, calculateStrengthMetrics, DEFAULT_USER_PROFILE } from "@/utils/healthMetrics";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Real data from BodySpec DEXA report (Craig Campbell)
const mockData = {
  bodyComposition: {
    bodyFat: { current: 24.8, target: 18.0, trend: 1.2 }, // Latest: 24.8%, up from 23.6%
    leanMass: { current: 149.4, previous: 152.8, trend: -3.4 }, // Down from previous scan
    totalWeight: { current: 210.4, target: 200.0 }
  },
  devices: {
    whoop: { recovery: 85, strain: 14.2, sleep: 7.8 },
    lumen: { metabolicFlex: 78, zone: "Fat Burning" },
    strongLifts: { lastWorkout: "Squat 225lbs", streak: 12 },
    steps: { current: 8420, target: 10000 }
  },
  nextDexa: "2025-08-15"
};

export const HealthDashboard = () => {
  const [whoopData, setWhoopData] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>("dashboard");
  
  // Load data from localStorage and active plan on component mount
  useEffect(() => {
    // Load health data from localStorage
    const savedData = localStorage.getItem('healthDashboardData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('📥 Loaded data from localStorage:', parsedData);
        setWhoopData(parsedData);
      } catch (error) {
        console.error('❌ Error loading data from localStorage:', error);
        localStorage.removeItem('healthDashboardData'); // Clear corrupted data
      }
    }

    // Load active plan
    loadActivePlan();
  }, []);

  const loadActivePlan = async () => {
    try {
      const { data: plan, error } = await supabase
        .from('fitness_plans')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPlanData(plan);
    } catch (error) {
      console.error('Error loading active plan:', error);
    }
  };
  
  console.log('🏠 HealthDashboard render - current whoopData state:', whoopData);
  console.log('🏋️ StrongLifts data check:', {
    hasWhoopData: !!whoopData,
    hasStronglifts: !!whoopData?.stronglifts,
    strongliftsLength: whoopData?.stronglifts?.length || 0,
    strongliftsType: typeof whoopData?.stronglifts
  });

  // Calculate TDEE and strength metrics when data changes
  const healthMetrics = useMemo(() => {
    console.log('🧮 Calculating healthMetrics with whoopData:', whoopData);
    console.log('🏋️ StrongLifts data available:', whoopData?.stronglifts?.length || 0);
    
    // Force immediate log of what we're passing to the calculation
    if (whoopData?.stronglifts) {
      console.log('📊 About to calculate with StrongLifts data length:', whoopData.stronglifts.length);
    }
    
    const tdeeData = calculateTDEE(
      DEFAULT_USER_PROFILE.weight,
      DEFAULT_USER_PROFILE.height,
      DEFAULT_USER_PROFILE.age,
      DEFAULT_USER_PROFILE.gender,
      whoopData?.daily,
      whoopData?.stronglifts
    );

    const strengthMetrics = whoopData?.stronglifts 
      ? calculateStrengthMetrics(whoopData.stronglifts)
      : null;

    console.log('✅ Calculated strengthMetrics:', strengthMetrics);
    console.log('🔢 TDEE data:', tdeeData);
    
    // Immediate volume comparison check
    if (strengthMetrics) {
      console.log('⚠️ VOLUME COMPARISON CHECK:');
      console.log('   Weekly Volume:', strengthMetrics.weekly.volume);
      console.log('   Monthly Volume:', strengthMetrics.monthly.volume);
      console.log('   Weekly > Monthly?', strengthMetrics.weekly.volume > strengthMetrics.monthly.volume);
    }

    return { tdeeData, strengthMetrics };
  }, [whoopData]);

  const handleWhoopDataUpdate = (data: any) => {
    console.log('🔄 HealthDashboard received data update:', data);
    console.log('🔍 Data structure analysis:', {
      hasRecovery: data?.recovery?.length || 0,
      hasSleep: data?.sleep?.length || 0,
      hasWorkouts: data?.workouts?.length || 0,
      hasDaily: data?.daily?.length || 0,
      hasJournal: data?.journal?.length || 0,
      hasStronglifts: data?.stronglifts?.length || 0,
      strongliftsDataType: typeof data?.stronglifts,
      strongliftsIsArray: Array.isArray(data?.stronglifts),
      strongliftsSample: data?.stronglifts?.slice(0, 2)
    });
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('healthDashboardData', JSON.stringify(data));
      console.log('💾 Data saved to localStorage successfully');
    } catch (error) {
      console.error('❌ Error saving data to localStorage:', error);
    }
    
    console.log('📦 Setting whoopData state with:', data);
    setWhoopData(data);
    
    // Immediate verification
    console.log('⚡ Current whoopData after setState:', whoopData);
    
    // Delayed verification to check if state persisted
    setTimeout(() => {
      console.log('⏱️ Checking localStorage after setState...');
      const savedData = localStorage.getItem('healthDashboardData');
      if (savedData) {
        console.log('✅ Data still exists in localStorage');
      } else {
        console.log('❌ Data missing from localStorage');
      }
    }, 1000);
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "connect", label: "Connect", icon: Settings },
    { id: "optimize", label: "Optimize", icon: Brain }
  ];

  const renderMainContent = () => {
    switch (activeSection) {
      case "connect":
        return (
          <div className="space-y-8">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Connect Your Devices
              </h2>
              <div className="grid gap-6">
                <div className="animate-fade-in-up [animation-delay:100ms]">
                  <WhoopConnect onDataUpdate={handleWhoopDataUpdate} />
                </div>
                <div className="animate-fade-in-up [animation-delay:200ms]">
                  <AppleHealthConnect onDataUpdate={(data) => console.log('Apple Health data:', data)} />
                </div>
              </div>
            </div>
          </div>
        );
      case "optimize":
        return (
          <div className="space-y-8">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                Optimize Your Health
              </h2>
              <div className="grid gap-6">
                <div className="animate-fade-in-up [animation-delay:100ms]">
                  {planData ? (
                    <PlanDashboard whoopData={whoopData} />
                  ) : (
                    <PlanSetup onPlanCreated={loadActivePlan} />
                  )}
                </div>
                <div className="animate-fade-in-up [animation-delay:200ms]">
                  <GoalSetting whoopData={whoopData} />
                </div>
                <div className="animate-fade-in-up [animation-delay:300ms]">
                  <AICoachPanel whoopData={whoopData} planData={planData} />
                </div>
                <div className="animate-fade-in-up [animation-delay:400ms]">
                  <VoiceInterface whoopData={whoopData} />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            {/* Mobile Health Integration Banner */}
            <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800 animate-fade-in shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2">
                        🚀 Recommended: Mobile-First Apple Health Integration
                      </h3>
                      <p className="text-xs text-blue-700 dark:text-blue-300 opacity-90">
                        Streamlined data collection & smart notifications
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span><strong>One integration</strong> syncs all your apps (WHOOP, MyFitnessPal, etc.)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span><strong>Smart iOS notifications</strong> for recovery, sleep, and training alerts</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span><strong>Automatic background sync</strong> with real-time health insights</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => setActiveSection("connect")}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      size="sm"
                    >
                      Set Up Mobile App →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unified Health Insights */}
            <div className="animate-fade-in-up [animation-delay:200ms]">
              <UnifiedHealthInsights whoopData={whoopData} />
            </div>

            {/* Key Metrics */}
            <div className="space-y-6">
              <div className="flex items-center justify-between animate-fade-in-up [animation-delay:300ms]">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Key Health Metrics</h3>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-medium">About These Metrics</p>
                        <p className="text-sm">Real-time insights from your connected devices. Each card shows current values, targets, trends, and progress indicators to help you optimize your health and performance.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="animate-fade-in-up [animation-delay:400ms]">
                  <MetricCard
                    title="Body Fat Progress"
                    value={`${mockData.bodyComposition.bodyFat.current}%`}
                    target={`Target: ${mockData.bodyComposition.bodyFat.target}% by 9/30`}
                    trend={-mockData.bodyComposition.bodyFat.trend}
                    icon={Target}
                    variant="primary"
                    tooltip={
                      <div className="space-y-2">
                        <div className="font-medium">Body Fat Tracking</div>
                        <div className="text-sm space-y-1">
                          <p>• Latest DEXA scan: {mockData.bodyComposition.bodyFat.current}%</p>
                          <p>• Goal: {mockData.bodyComposition.bodyFat.target}% by September 30th</p>
                          <p>• Progress: {mockData.bodyComposition.bodyFat.trend > 0 ? 'Increasing' : 'Decreasing'} by {Math.abs(mockData.bodyComposition.bodyFat.trend)}%</p>
                          <p>• Method: Professional DEXA body composition analysis</p>
                        </div>
                      </div>
                    }
                  />
                </div>
                <div className="animate-fade-in-up [animation-delay:500ms]">
                  <MetricCard
                    title="Lean Mass Progress"
                    value={`${mockData.bodyComposition.leanMass.current} lbs`}
                    target={`Target: +5 lbs by 10/30`}
                    trend={mockData.bodyComposition.leanMass.trend}
                    icon={Dumbbell}
                    variant="success"
                    tooltip={
                      <div className="space-y-2">
                        <div className="font-medium">Lean Body Mass</div>
                        <div className="text-sm space-y-1">
                          <p>• Current: {mockData.bodyComposition.leanMass.current} lbs</p>
                          <p>• Previous: {mockData.bodyComposition.leanMass.previous} lbs</p>
                          <p>• Change: {mockData.bodyComposition.leanMass.trend > 0 ? '+' : ''}{mockData.bodyComposition.leanMass.trend} lbs</p>
                          <p>• Includes: Muscle mass, bone density, organs, water</p>
                          <p>• Goal: Build 5 lbs lean mass by October 30th</p>
                        </div>
                      </div>
                    }
                  />
                </div>
                <div className="animate-fade-in-up [animation-delay:600ms]">
                  <MetricCard
                    title="Recovery Score"
                    value={whoopData?.recovery?.length > 0 ? `${whoopData.recovery[whoopData.recovery.length - 1].recovery_score}%` : `${mockData.devices.whoop.recovery}%`}
                    target="Target: 70%+"
                    trend={whoopData?.recovery?.length > 1 ? 
                      Math.round(whoopData.recovery[whoopData.recovery.length - 1].recovery_score - 
                      whoopData.recovery.slice(-7).reduce((sum, r) => sum + r.recovery_score, 0) / Math.min(7, whoopData.recovery.length)) : 
                      5}
                    icon={Heart}
                    variant="accent"
                    tooltip={
                      <div className="space-y-2">
                        <div className="font-medium">WHOOP Recovery Score</div>
                        <div className="text-sm space-y-1">
                          <p>• Composite score measuring training readiness</p>
                          <p>• Based on: HRV, resting heart rate, sleep quality</p>
                          <p>• Green (70%+): Ready for high intensity</p>
                          <p>• Yellow (34-69%): Moderate intensity recommended</p>
                          <p>• Red (0-33%): Focus on recovery and rest</p>
                          <p>• Updates daily upon waking</p>
                        </div>
                      </div>
                    }
                  />
                </div>
                <div className="animate-fade-in-up [animation-delay:700ms]">
                  <MetricCard
                    title="TDEE"
                    value={`${healthMetrics.tdeeData.tdee} cal`}
                    target="Target: 2400 cal"
                    trend={healthMetrics.tdeeData.tdee - healthMetrics.tdeeData.bmr}
                    icon={Flame}
                    variant="warning"
                    tooltip={
                      <div className="space-y-2">
                        <div className="font-medium">Total Daily Energy Expenditure</div>
                        <div className="text-sm space-y-1">
                          <p>• BMR (Base): {healthMetrics.tdeeData.bmr} cal</p>
                          <p>• Activity: +{healthMetrics.tdeeData.tdee - healthMetrics.tdeeData.bmr} cal</p>
                          <p>• Total TDEE: {healthMetrics.tdeeData.tdee} cal</p>
                          <p>• For fat loss: Eat 2400 cal (465 cal deficit)</p>
                          <p>• Deficit = 1 lb fat loss per week</p>
                          <p>• Based on: Age, weight, height, activity level</p>
                        </div>
                      </div>
                    }
                  />
                </div>
                <div className="animate-fade-in-up [animation-delay:800ms]">
                  <MetricCard
                    title="Weekly Volume"
                    value={healthMetrics.strengthMetrics?.weekly.volume 
                      ? `${(healthMetrics.strengthMetrics.weekly.volume / 1000).toFixed(1)}k lbs`
                      : "No data"
                    }
                    target="Target: 180k lbs"
                    trend={healthMetrics.strengthMetrics?.weekly.workouts || 0}
                    icon={Dumbbell}
                    variant="primary"
                    tooltip={
                      <div className="space-y-2">
                        <div className="font-medium">Training Volume (7 days)</div>
                        <div className="text-sm space-y-1">
                          <p>• Total weight moved: {healthMetrics.strengthMetrics?.weekly.volume ? `${(healthMetrics.strengthMetrics.weekly.volume / 1000).toFixed(1)}k lbs` : 'No data'}</p>
                          <p>• Workouts completed: {healthMetrics.strengthMetrics?.weekly.workouts || 0}</p>
                          <p>• Target: 180k lbs weekly for growth</p>
                          <p>• Calculation: Sets × Reps × Weight</p>
                          <p>• Tracks: Progressive overload progress</p>
                          <p>• Data source: StrongLifts 5x5 app</p>
                        </div>
                      </div>
                    }
                  />
                </div>
                <div className="animate-fade-in-up [animation-delay:900ms]">
                  <MetricCard
                    title="Sleep Quality"
                    value={whoopData?.sleep?.length > 0 
                      ? `${whoopData.sleep[whoopData.sleep.length - 1].sleep_efficiency_percentage || 85}%` 
                      : "85%"
                    }
                    target="Target: 85%+ & 8h"
                    trend={whoopData?.sleep?.length > 1 
                      ? Math.round(whoopData.sleep[whoopData.sleep.length - 1].sleep_efficiency_percentage - 
                        whoopData.sleep.slice(-7).reduce((sum, s) => sum + s.sleep_efficiency_percentage, 0) / Math.min(7, whoopData.sleep.length))
                      : 5
                    }
                    icon={Heart}
                    variant="accent"
                    tooltip={
                      <div className="space-y-2">
                        <div className="font-medium">Sleep Efficiency & Quality</div>
                        <div className="text-sm space-y-1">
                          <p>• Efficiency: Time asleep ÷ time in bed</p>
                          <p>• Target: 85%+ efficiency with 8+ hours total</p>
                          <p>• Quality factors: Deep sleep, REM, wake events</p>
                          <p>• Optimal range: 85-95% efficiency</p>
                          <p>• Poor (&lt;80%): Review sleep environment</p>
                          <p>• Data: WHOOP sleep tracking</p>
                        </div>
                      </div>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Body Composition Chart */}
            <div className="animate-fade-in-up [animation-delay:1000ms]">
              <BodyCompositionChart />
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar className="w-64 border-r border-border/60 backdrop-blur-sm">
          <SidebarContent>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-gradient-primary/10 border border-primary/20">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-bold">CC</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-sm">Craig Campbell</h2>
                  <Badge variant="outline" className="text-xs mt-1 border-primary/30 text-primary">
                    Next DEXA: {mockData.nextDexa}
                  </Badge>
                </div>
              </div>
            </div>
            
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wide font-medium px-3">Health Hub</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          "w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-300",
                          "hover:bg-sidebar-accent/60 hover:scale-[1.02]",
                          activeSection === item.id 
                            ? "bg-primary text-primary-foreground shadow-primary/20 shadow-md" 
                            : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium">{item.label}</span>
                        {activeSection === item.id && (
                          <div className="ml-auto h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-sidebar-accent/60 transition-colors" />
                <div className="animate-fade-in-up">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Health Dashboard
                  </h1>
                  <p className="text-muted-foreground mt-1">Optimizing body composition through data-driven insights</p>
                </div>
              </div>
            </div>
            <div className="animate-fade-in-up [animation-delay:200ms]">
              {renderMainContent()}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};