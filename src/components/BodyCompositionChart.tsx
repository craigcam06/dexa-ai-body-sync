import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Calendar } from "lucide-react";

// Real DEXA scan data from BodySpec report (Craig Campbell)
const mockDexaData = [
  { date: "2025-05-18", bodyFat: 25.1, leanMass: 149.8, totalWeight: 212.1 },
  { date: "2025-06-01", bodyFat: 23.9, leanMass: 150.6, totalWeight: 209.7 },
  { date: "2025-06-22", bodyFat: 23.6, leanMass: 152.8, totalWeight: 211.7 },
  { date: "2025-07-14", bodyFat: 24.8, leanMass: 149.4, totalWeight: 210.4 }
];

export const BodyCompositionChart = () => {
  const latestData = mockDexaData[mockDexaData.length - 1];
  const previousData = mockDexaData[mockDexaData.length - 2];
  
  const bodyFatChange = latestData.bodyFat - previousData.bodyFat;
  const leanMassChange = latestData.leanMass - previousData.leanMass;
  
  const bodyFatProgress = ((28 - latestData.bodyFat) / (28 - 18)) * 100; // Progress toward 18% target (realistic for current level)
  const leanMassProgress = ((latestData.leanMass - 145) / (165 - 145)) * 100; // Progress toward 165lbs target

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Body Composition Trends
          </CardTitle>
          <Badge variant="outline" className="text-primary border-primary">
            <Calendar className="h-3 w-3 mr-1" />
            DEXA Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bars */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Body Fat Progress</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{latestData.bodyFat}%</span>
                <Badge 
                  variant={bodyFatChange < 0 ? "default" : "secondary"}
                  className={bodyFatChange < 0 ? "bg-success/10 text-success border-success/20" : ""}
                >
                  {bodyFatChange > 0 ? '+' : ''}{bodyFatChange.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <Progress value={bodyFatProgress} className="h-3" />
            <p className="text-xs text-muted-foreground">Target: 18% body fat</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Lean Mass Progress</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{latestData.leanMass} lbs</span>
                <Badge 
                  variant={leanMassChange > 0 ? "default" : "secondary"}
                  className={leanMassChange > 0 ? "bg-success/10 text-success border-success/20" : ""}
                >
                  {leanMassChange > 0 ? '+' : ''}{leanMassChange.toFixed(1)} lbs
                </Badge>
              </div>
            </div>
            <Progress value={leanMassProgress} className="h-3" />
            <p className="text-xs text-muted-foreground">Target: 165 lbs lean mass</p>
          </div>
        </div>

        {/* Recent DEXA History */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Recent DEXA Scans
          </h4>
          <div className="space-y-2">
            {mockDexaData.slice(-3).reverse().map((scan, index) => (
              <div key={scan.date} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <span className="text-sm font-medium">{new Date(scan.date).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span>{scan.bodyFat}% BF</span>
                  <span>{scan.leanMass} LM</span>
                  <span className="text-muted-foreground">{scan.totalWeight} lbs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/10">
          <h4 className="font-medium text-sm mb-2 text-primary">Body Recomposition Progress</h4>
          <p className="text-sm text-muted-foreground">
            Body fat increased by {bodyFatChange.toFixed(1)}% and lean mass decreased by {Math.abs(leanMassChange).toFixed(1)} lbs since last scan. 
            Focus on consistent training and nutrition to reverse this trend.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};