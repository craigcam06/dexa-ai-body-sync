import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface CombinedVolumeCardProps {
  weeklyVolume?: number;
  weeklyWorkouts?: number;
  weeklySets?: number;
  monthlyVolume?: number;
  monthlyWorkouts?: number;
  monthlySets?: number;
  tooltip?: string;
}

export const CombinedVolumeCard = ({
  weeklyVolume,
  weeklyWorkouts = 0,
  weeklySets,
  monthlyVolume,
  monthlyWorkouts = 0,
  monthlySets,
  tooltip
}: CombinedVolumeCardProps) => {
  const hasData = weeklyVolume && monthlyVolume;
  
  const cardContent = (
    <Card className="shadow-card transition-smooth hover:shadow-primary border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Dumbbell className="h-5 w-5 text-primary" />
          {hasData && (
            <Badge 
              variant="default"
              className="bg-success/10 text-success border-success/20"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {monthlyWorkouts}
            </Badge>
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Training Volume</p>
            <div className="space-y-2 mt-2">
              {/* Weekly Volume */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Weekly</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {hasData ? `${(weeklyVolume / 1000).toFixed(1)}k lbs` : "No data"}
                  </p>
                  {weeklySets && (
                    <p className="text-xs text-muted-foreground">{weeklySets} sets</p>
                  )}
                </div>
              </div>
              
              {/* Monthly Volume */}
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm text-muted-foreground">30-Day</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {hasData ? `${(monthlyVolume / 1000).toFixed(1)}k lbs` : "No data"}
                  </p>
                  {monthlySets && (
                    <p className="text-xs text-muted-foreground">{monthlySets} sets</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
};