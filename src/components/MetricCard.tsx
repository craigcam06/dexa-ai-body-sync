import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  target?: string;
  trend?: number;
  icon: LucideIcon;
  variant?: "primary" | "success" | "accent" | "warning";
  tooltip?: string;
  isLoading?: boolean;
}

export const MetricCard = ({
  title,
  value,
  target,
  trend,
  icon: Icon,
  variant = "primary",
  tooltip,
  isLoading = false
}: MetricCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const variantStyles = {
    primary: "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15",
    success: "border-success/20 bg-gradient-to-br from-success/5 to-success/10 hover:from-success/10 hover:to-success/15",
    accent: "border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 hover:from-accent/10 hover:to-accent/15",
    warning: "border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10 hover:from-warning/10 hover:to-warning/15"
  };

  const iconStyles = {
    primary: "text-primary",
    success: "text-success", 
    accent: "text-accent",
    warning: "text-warning"
  };

  const getStatusClass = () => {
    if (!trend) return "";
    if (trend > 0) return "status-excellent";
    if (trend === 0) return "status-good";
    if (trend > -5) return "status-warning";
    return "status-critical";
  };

  if (isLoading) {
    return (
      <Card className="health-card animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-5 bg-muted rounded skeleton"></div>
            <div className="h-5 w-12 bg-muted rounded skeleton"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted rounded skeleton"></div>
            <div className="h-6 w-16 bg-muted rounded skeleton"></div>
            <div className="h-3 w-24 bg-muted rounded skeleton"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <Card 
      className={cn(
        "health-card-interactive animate-fade-in group",
        variantStyles[variant],
        getStatusClass(),
        isHovered && "scale-[1.02] shadow-glow"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={cn(
            "p-2 rounded-lg transition-all duration-300",
            "bg-white/50 dark:bg-black/20",
            isHovered && "scale-110 rotate-3"
          )}>
            <Icon className={cn(
              "h-5 w-5 transition-colors duration-300",
              iconStyles[variant],
              isHovered && "animate-bounce-gentle"
            )} />
          </div>
          
          {trend !== undefined && (
            <Badge 
              variant={trend >= 0 ? "default" : "secondary"} 
              className={cn(
                "text-xs transition-all duration-300 group-hover:scale-105",
                trend >= 0 
                  ? "bg-success/20 text-success border-success/30 hover:bg-success/30" 
                  : "bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30"
              )}
            >
              <div className="flex items-center gap-1">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="font-medium">
                  {trend > 0 ? '+' : ''}{Math.abs(trend).toFixed(1)}
                </span>
              </div>
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className={cn(
            "text-2xl font-bold transition-all duration-300",
            "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent",
            isHovered && "scale-105"
          )}>
            {value}
          </p>
          {target && (
            <p className="text-xs text-muted-foreground font-medium">
              {target}
            </p>
          )}
        </div>

        {/* Progress indicator */}
        {trend !== undefined && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className={cn(
                "text-xs font-medium",
                trend >= 0 ? "text-success" : "text-destructive"
              )}>
                {trend >= 0 ? "Improving" : "Needs attention"}
              </span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  trend >= 0 ? "bg-gradient-to-r from-success to-success/80" : "bg-gradient-to-r from-destructive to-destructive/80"
                )}
                style={{ 
                  width: `${Math.min(100, Math.abs(trend) * 10)}%`,
                  animation: isHovered ? 'shimmer 1.5s ease-in-out' : undefined
                }}
              />
            </div>
          </div>
        )}
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
          <TooltipContent 
            side="top" 
            className="max-w-xs p-3 bg-card/95 backdrop-blur-sm border border-border/60 shadow-lg"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{title}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{tooltip}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
};