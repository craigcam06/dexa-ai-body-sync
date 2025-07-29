import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Brain, 
  MessageSquare, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

// Mock AI coach insights and recommendations
const coachInsights = [
  {
    type: "success",
    title: "Great Recovery Trends",
    message: "Your Whoop data shows 85% recovery. Perfect time for a high-intensity workout today.",
    priority: "low",
    timestamp: "2 hours ago"
  },
  {
    type: "warning", 
    title: "Metabolism Optimization",
    message: "Lumen shows you're in fat-burning mode. Consider extending your fasting window by 2 hours.",
    priority: "medium",
    timestamp: "This morning"
  },
  {
    type: "info",
    title: "Strength Progress",
    message: "StrongLifts data suggests increasing squat weight by 5lbs next session based on your lean mass gains.",
    priority: "high",
    timestamp: "Yesterday"
  }
];

const upcomingActions = [
  { task: "DEXA Scan", date: "Jan 15", status: "scheduled" },
  { task: "Nutrition Review", date: "Jan 8", status: "pending" },
  { task: "Training Adjustment", date: "Jan 5", status: "completed" }
];

interface AICoachPanelProps {
  whoopData?: any;
}

export const AICoachPanel = ({ whoopData }: AICoachPanelProps) => {
  // Generate dynamic insights based on real Whoop data
  const generateInsights = () => {
    const insights = [...coachInsights];
    
    if (whoopData?.recovery) {
      const recoveryScore = whoopData.recovery.score.recovery_score;
      const hrv = whoopData.recovery.score.hrv_rmssd_milli;
      
      if (recoveryScore >= 80) {
        insights.unshift({
          type: "success",
          title: "Excellent Recovery",
          message: `Your recovery score of ${recoveryScore}% indicates you're ready for high-intensity training. Consider progressive overload today.`,
          priority: "high",
          timestamp: "Live data"
        });
      } else if (recoveryScore < 60) {
        insights.unshift({
          type: "warning",
          title: "Low Recovery Alert",
          message: `Recovery at ${recoveryScore}%. Focus on light movement, hydration, and sleep optimization today.`,
          priority: "high",
          timestamp: "Live data"
        });
      }
      
      if (hrv < 30) {
        insights.push({
          type: "info",
          title: "HRV Optimization",
          message: `HRV at ${Math.round(hrv)}ms suggests stress management focus. Try breathing exercises or meditation.`,
          priority: "medium",
          timestamp: "Live data"
        });
      }
    }
    
    return insights.slice(0, 4); // Limit to 4 insights
  };
  return (
    <div className="space-y-4">
      {/* AI Coach Chat */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Fitness Coach
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Coach Avatar & Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-primary">
            <Avatar className="border-2 border-primary-foreground/20">
              <AvatarFallback className="bg-primary-foreground text-primary font-bold">AI</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-primary-foreground">Coach Alex</p>
              <p className="text-sm text-primary-foreground/80">Analyzing your data...</p>
            </div>
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-8">
              <MessageSquare className="h-3 w-3 mr-1" />
              Ask Coach
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              <Lightbulb className="h-3 w-3 mr-1" />
              Get Tips
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Insights */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lightbulb className="h-4 w-4 text-accent" />
            Live Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {generateInsights().map((insight, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start gap-2">
                {insight.type === "success" && <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />}
                {insight.type === "warning" && <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />}
                {insight.type === "info" && <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        insight.priority === "high" ? "border-destructive text-destructive" :
                        insight.priority === "medium" ? "border-warning text-warning" :
                        "border-muted-foreground text-muted-foreground"
                      }`}
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{insight.message}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {insight.timestamp}
                  </p>
                </div>
              </div>
              {index < generateInsights().length - 1 && <div className="border-b border-border" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Upcoming Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingActions.map((action, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  action.status === "completed" ? "bg-success" :
                  action.status === "scheduled" ? "bg-primary" :
                  "bg-warning"
                }`} />
                <span className="text-sm font-medium">{action.task}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{action.date}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    action.status === "completed" ? "border-success text-success" :
                    action.status === "scheduled" ? "border-primary text-primary" :
                    "border-warning text-warning"
                  }`}
                >
                  {action.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};