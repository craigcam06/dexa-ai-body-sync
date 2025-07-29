import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Upload
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { BodyCompositionChart } from "./BodyCompositionChart";
import { HealthInsights } from "./HealthInsights";
import { AICoachPanel } from "./AICoachPanel";
import { WhoopConnect } from "./WhoopConnect";
import { AppleHealthConnect } from "./AppleHealthConnect";
import { SmartNotifications } from "./SmartNotifications";
import { GoalSetting } from "./GoalSetting";
import { VoiceInterface } from "./VoiceInterface";
import { calculateTDEE, calculateStrengthMetrics, DEFAULT_USER_PROFILE } from "@/utils/healthMetrics";

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
  
  // Load data from localStorage on component mount
  useEffect(() => {
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
  }, []);
  
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
      console.log('⏱️ whoopData state 1 second later:', whoopData);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Health Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Optimizing body composition through data-driven insights</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            onClick={() => {
              console.log('Upload button clicked!');
              // Try multiple approaches to find the upload section
              
              // First try to find mobile connect section
              let connectSection = document.querySelector('.lg\\:hidden .space-y-4');
              console.log('Found mobile connect section:', connectSection);
              
              // If not found, try desktop connect section
              if (!connectSection) {
                connectSection = document.querySelector('[data-state="inactive"]');
                console.log('Found desktop connect section:', connectSection);
              }
              
              // If still not found, try finding the WhoopConnect component
              if (!connectSection) {
                connectSection = document.querySelector('[role="tabpanel"]');
                console.log('Found tab panel:', connectSection);
              }
              
              if (connectSection) {
                connectSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                console.log('Scrolled to connect section');
              } else {
                // Final fallback: just scroll down significantly
                console.log('No connect section found, scrolling to bottom');
                window.scrollTo({ top: document.body.scrollHeight - window.innerHeight, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            size="sm"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload Health Data</span>
            <span className="sm:hidden">Upload</span>
          </Button>
          <Badge variant="outline" className="text-success border-success text-xs sm:text-sm">
            Next DEXA: {mockData.nextDexa}
          </Badge>
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">CC</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Smart Notifications */}
      <SmartNotifications whoopData={whoopData} />

      {/* Key Metrics - Row 1: Body Composition & Recovery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="Body Fat Progress"
          value={`${mockData.bodyComposition.bodyFat.current}%`}
          target={`Target: ${mockData.bodyComposition.bodyFat.target}%`}
          trend={-mockData.bodyComposition.bodyFat.trend} // Invert: increases show as negative (red)
          icon={Target}
          variant="primary"
          tooltip="Body fat percentage from latest DEXA scan. Target is optimal range for your physique goals."
        />
        <MetricCard
          title="Lean Mass Progress"
          value={`${mockData.bodyComposition.leanMass.current} lbs`}
          target={`+${mockData.bodyComposition.leanMass.trend} lbs`}
          trend={mockData.bodyComposition.leanMass.trend}
          icon={Dumbbell}
          variant="success"
          tooltip="Lean body mass (muscle + bone) from DEXA scan. Goal is to maintain or increase while losing fat."
        />
        <MetricCard
          title="Recovery Score"
          value={whoopData?.recovery?.length > 0 ? `${whoopData.recovery[whoopData.recovery.length - 1].recovery_score}%` : `${mockData.devices.whoop.recovery}%`}
          target="Whoop"
          trend={whoopData?.recovery?.length > 1 ? 
            Math.round(whoopData.recovery[whoopData.recovery.length - 1].recovery_score - 
            whoopData.recovery.slice(-7).reduce((sum, r) => sum + r.recovery_score, 0) / Math.min(7, whoopData.recovery.length)) : 
            5}
          icon={Heart}
          variant="accent"
          tooltip="Daily recovery score from Whoop. Measures readiness for training based on HRV, RHR, and sleep quality. 70%+ is optimal."
        />
      </div>

      {/* Key Metrics - Row 2: Performance & Training */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="TDEE"
          value={`${healthMetrics.tdeeData.tdee} cal`}
          target={healthMetrics.tdeeData.activityLevel}
          trend={healthMetrics.tdeeData.tdee - healthMetrics.tdeeData.bmr}
          icon={Flame}
          variant="warning"
          tooltip="Total Daily Energy Expenditure calculated from BMR + activity level. Use this for calorie targets - deficit for fat loss, surplus for muscle gain."
        />
        <MetricCard
          title="Weekly Volume"
          value={healthMetrics.strengthMetrics?.weekly.volume 
            ? `${(healthMetrics.strengthMetrics.weekly.volume / 1000).toFixed(1)}k lbs`
            : "No data"
          }
          target={healthMetrics.strengthMetrics?.weekly.sets 
            ? `${healthMetrics.strengthMetrics.weekly.sets} sets`
            : "Upload CSV data"
          }
          trend={healthMetrics.strengthMetrics?.weekly.workouts || 0}
          icon={Dumbbell}
          variant="primary"
          tooltip="Total weight lifted in past 7 days. Most actionable metric for tracking training intensity and weekly consistency."
        />
        <MetricCard
          title="Sleep Quality"
          value={whoopData?.sleep?.length > 0 
            ? `${whoopData.sleep[whoopData.sleep.length - 1].sleep_efficiency_percentage || 85}%` 
            : "85%"
          }
          target={whoopData?.sleep?.length > 0 
            ? `${(whoopData.sleep[whoopData.sleep.length - 1].total_sleep_time_milli / (1000 * 60 * 60)).toFixed(1)}h sleep`
            : "8.2h sleep"
          }
          trend={whoopData?.sleep?.length > 1 
            ? Math.round(whoopData.sleep[whoopData.sleep.length - 1].sleep_efficiency_percentage - 
              whoopData.sleep.slice(-7).reduce((sum, s) => sum + s.sleep_efficiency_percentage, 0) / Math.min(7, whoopData.sleep.length))
            : 5
          }
          icon={Heart}
          variant="accent"
          tooltip="Sleep efficiency from Whoop. Shows percentage of time in bed actually sleeping. 85%+ is excellent for recovery and performance."
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Body Composition Chart */}
        <div className="lg:col-span-2">
          <BodyCompositionChart />
        </div>

        {/* Right Panel with Tabs */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="insights" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-4">
              <TabsTrigger value="insights" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Insights</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Goals</span>
                <span className="sm:hidden">Goals</span>
              </TabsTrigger>
              <TabsTrigger value="coach" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">AI Coach</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Voice</span>
                <span className="sm:hidden">Voice</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="insights">
              <HealthInsights whoopData={whoopData} />
            </TabsContent>
            
            <TabsContent value="goals">
              <GoalSetting whoopData={whoopData} />
            </TabsContent>
            
            <TabsContent value="coach">
              <AICoachPanel whoopData={whoopData} />
            </TabsContent>

            <TabsContent value="voice">
              <VoiceInterface whoopData={whoopData} />
            </TabsContent>
            
            {/* Devices moved to bottom for mobile */}
            <div className="lg:hidden mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Connect Devices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AppleHealthConnect onDataUpdate={(data) => console.log('Apple Health data:', data)} />
                  <WhoopConnect onDataUpdate={handleWhoopDataUpdate} />
                </CardContent>
              </Card>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Device Integration Status - Hidden on mobile, shown on desktop */}
      <Card className="shadow-card hidden lg:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Connected Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "DEXA Scan", icon: Target, status: "connected", lastSync: "3 days ago" },
              { name: "Whoop", icon: Heart, status: "connected", lastSync: "2 min ago" },
              { name: "Apple Health", icon: Apple, status: "connected", lastSync: "1 hour ago" },
              { name: "Lumen", icon: Zap, status: "connected", lastSync: "Morning" },
              { name: "StrongLifts", icon: Dumbbell, status: "connected", lastSync: "Yesterday" },
              { name: "Pedometer++", icon: Activity, status: "connected", lastSync: "5 min ago" }
            ].map((device) => (
              <div key={device.name} className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-gradient-primary rounded-full flex items-center justify-center">
                  <device.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <p className="font-medium text-xs sm:text-sm">{device.name}</p>
                <p className="text-xs text-muted-foreground">{device.lastSync}</p>
                <div className="w-2 h-2 bg-success rounded-full mx-auto mt-1"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};