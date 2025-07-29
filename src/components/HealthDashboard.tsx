import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Activity, 
  Brain, 
  Heart, 
  TrendingUp, 
  Zap, 
  Apple,
  Dumbbell,
  Target,
  MessageSquare
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { BodyCompositionChart } from "./BodyCompositionChart";
import { AICoachPanel } from "./AICoachPanel";

// Mock data - will be replaced with real API data
const mockData = {
  bodyComposition: {
    bodyFat: { current: 15.2, target: 12.0, trend: -0.8 },
    leanMass: { current: 152.8, previous: 150.6, trend: 2.2 },
    totalWeight: { current: 180.5, target: 175.0 }
  },
  devices: {
    whoop: { recovery: 85, strain: 14.2, sleep: 7.8 },
    lumen: { metabolicFlex: 78, zone: "Fat Burning" },
    strongLifts: { lastWorkout: "Squat 225lbs", streak: 12 },
    steps: { current: 8420, target: 10000 }
  },
  nextDexa: "2025-01-15"
};

export const HealthDashboard = () => {
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
          value={`${mockData.devices.whoop.recovery}%`}
          target="Whoop"
          trend={5}
          icon={Heart}
          variant="accent"
        />
        <MetricCard
          title="Metabolic Flex"
          value={`${mockData.devices.lumen.metabolicFlex}%`}
          target="Lumen"
          trend={3}
          icon={Zap}
          variant="warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Body Composition Chart */}
        <div className="lg:col-span-2">
          <BodyCompositionChart />
        </div>

        {/* AI Coach Panel */}
        <div className="lg:col-span-1">
          <AICoachPanel />
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