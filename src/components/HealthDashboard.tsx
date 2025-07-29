import { useState } from "react";
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
  Settings
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { BodyCompositionChart } from "./BodyCompositionChart";
import { AICoachPanel } from "./AICoachPanel";
import { WhoopConnect } from "./WhoopConnect";
import { DataAnalytics } from "./DataAnalytics";

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
  console.log('HealthDashboard current whoopData state:', whoopData);

  const handleWhoopDataUpdate = (data: any) => {
    console.log('HealthDashboard received data update:', data);
    console.log('Data structure:', {
      hasRecovery: data?.recovery?.length || 0,
      hasSleep: data?.sleep?.length || 0,
      hasWorkouts: data?.workouts?.length || 0,
      hasDaily: data?.daily?.length || 0,
      hasJournal: data?.journal?.length || 0,
      hasStronglifts: data?.stronglifts?.length || 0
    });
    console.log('Setting whoopData state with:', data);
    setWhoopData(data);
    console.log('whoopData state should now be updated');
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Health Dashboard</h1>
          <p className="text-muted-foreground">Optimizing body composition through data-driven insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-success border-success">
            Next DEXA: {mockData.nextDexa}
          </Badge>
          <Avatar>
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">CC</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Body Fat %"
          value={`${mockData.bodyComposition.bodyFat.current}%`}
          target={`Target: ${mockData.bodyComposition.bodyFat.target}%`}
          trend={mockData.bodyComposition.bodyFat.trend}
          icon={Target}
          variant="primary"
        />
        <MetricCard
          title="Lean Mass"
          value={`${mockData.bodyComposition.leanMass.current} lbs`}
          target={`+${mockData.bodyComposition.leanMass.trend} lbs`}
          trend={mockData.bodyComposition.leanMass.trend}
          icon={Dumbbell}
          variant="success"
        />
        <MetricCard
          title="Recovery Score"
          value={whoopData?.recovery?.length > 0 ? `${whoopData.recovery[whoopData.recovery.length - 1].recovery_score}%` : `${mockData.devices.whoop.recovery}%`}
          target="Whoop"
          trend={whoopData?.recovery?.length > 0 ? (whoopData.recovery[whoopData.recovery.length - 1].recovery_score - 80) : 5}
          icon={Heart}
          variant="accent"
        />
        <MetricCard
          title="Max Weight"
          value={whoopData?.stronglifts?.length > 0 ? 
            `${Math.max(...whoopData.stronglifts.filter((s: any) => s.weight < 500).map((s: any) => s.weight))}lbs` : 
            `${mockData.devices.lumen.metabolicFlex}%`
          }
          target={whoopData?.stronglifts?.length > 0 ? "StrongLifts" : "Lumen"}
          trend={3}
          icon={whoopData?.stronglifts?.length > 0 ? Dumbbell : Zap}
          variant="warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Body Composition Chart */}
        <div className="lg:col-span-2">
          <BodyCompositionChart />
        </div>

        {/* Right Panel with Tabs */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="coach" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="coach" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Coach
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="devices" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Devices
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="coach">
              <AICoachPanel whoopData={whoopData} />
            </TabsContent>
            
            <TabsContent value="analytics">
              <DataAnalytics whoopData={whoopData} />
            </TabsContent>
            
            <TabsContent value="devices" className="space-y-4">
              <WhoopConnect onDataUpdate={handleWhoopDataUpdate} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Device Integration Status */}
      <Card className="shadow-card">
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
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-primary rounded-full flex items-center justify-center">
                  <device.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="font-medium text-sm">{device.name}</p>
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