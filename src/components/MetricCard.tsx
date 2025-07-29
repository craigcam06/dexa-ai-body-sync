import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  target?: string;
  trend?: number;
  icon: LucideIcon;
  variant?: "primary" | "success" | "accent" | "warning";
}

export const MetricCard = ({
  title,
  value,
  target,
  trend,
  icon: Icon,
  variant = "primary"
}: MetricCardProps) => {
  const variantStyles = {
    primary: "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10",
    success: "border-success/20 bg-gradient-to-br from-success/5 to-success/10",
    accent: "border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10",
    warning: "border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10"
  };

  const iconStyles = {
    primary: "text-primary",
    success: "text-success",
    accent: "text-accent",
    warning: "text-warning"
  };

  return (
    <Card className={cn("shadow-card transition-smooth hover:shadow-primary", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className={cn("h-6 w-6", iconStyles[variant])} />
          {trend !== undefined && (
            <Badge 
              variant={trend >= 0 ? "default" : "secondary"} 
              className={cn(
                "text-xs",
                trend >= 0 
                  ? "bg-success/10 text-success border-success/20" 
                  : "bg-destructive/10 text-destructive border-destructive/20"
              )}
            >
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(trend)}
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {target && (
            <p className="text-sm text-muted-foreground">{target}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};