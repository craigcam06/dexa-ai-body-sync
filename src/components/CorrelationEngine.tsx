import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Brain, 
  RefreshCw, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SmartLoading } from '@/components/ui/smart-loading';

interface CorrelationResult {
  metric1: string;
  metric2: string;
  correlation: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
  significance: number;
  insights: string;
}

interface CorrelationData {
  success: boolean;
  dataPoints: number;
  dateRange: {
    start: string;
    end: string;
  };
  correlations: CorrelationResult[];
  topCorrelations: CorrelationResult[];
  aiInsights: string;
  summary: {
    strongestPositive?: CorrelationResult;
    strongestNegative?: CorrelationResult;
    totalAnalyzed: number;
  };
}

export const CorrelationEngine: React.FC = () => {
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [daysBack, setDaysBack] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeCorrelations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('correlation-engine', {
        body: { daysBack }
      });

      if (error) throw error;

      if (data.error) {
        setError(data.error);
        toast({
          title: "Analysis Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      setCorrelationData(data);
      toast({
        title: "Analysis Complete! 🔍",
        description: `Found ${data.correlations.length} correlations from ${data.dataPoints} days of data`,
      });

    } catch (error) {
      console.error('Error analyzing correlations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze correlations';
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    analyzeCorrelations();
  }, []);

  const getCorrelationColor = (correlation: number) => {
    if (Math.abs(correlation) > 0.7) return 'text-green-600';
    if (Math.abs(correlation) > 0.4) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getStrengthBadge = (strength: string, direction: string) => {
    const variant = strength === 'strong' ? 'default' : 
                   strength === 'moderate' ? 'secondary' : 'outline';
    const icon = direction === 'positive' ? TrendingUp : TrendingDown;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {React.createElement(icon, { className: "w-3 h-3" })}
        {strength}
      </Badge>
    );
  };

  const formatMetricName = (metric: string) => {
    return metric
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Hr/g, 'HR')
      .replace(/Hrv/g, 'HRV');
  };

  if (error && !correlationData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Correlation Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={analyzeCorrelations} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Correlation Engine
              </CardTitle>
              <CardDescription>
                Discover patterns between your sleep, nutrition, and performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={daysBack} 
                onChange={(e) => setDaysBack(Number(e.target.value))}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
              <Button 
                onClick={analyzeCorrelations} 
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? (
                  <SmartLoading size="sm" />
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {correlationData && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {correlationData.dataPoints}
                </div>
                <div className="text-sm text-muted-foreground">Data Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {correlationData.summary.totalAnalyzed}
                </div>
                <div className="text-sm text-muted-foreground">Correlations Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {correlationData.topCorrelations.length}
                </div>
                <div className="text-sm text-muted-foreground">Significant Patterns</div>
              </div>
            </div>

            <Tabs defaultValue="insights" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
                <TabsTrigger value="correlations">Top Correlations</TabsTrigger>
                <TabsTrigger value="all">All Results</TabsTrigger>
              </TabsList>

              <TabsContent value="insights">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Personalized Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {correlationData.aiInsights}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="correlations">
                <div className="space-y-4">
                  {correlationData.topCorrelations.map((correlation, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">
                              {formatMetricName(correlation.metric1)} ↔ {formatMetricName(correlation.metric2)}
                            </div>
                            {getStrengthBadge(correlation.strength, correlation.direction)}
                          </div>
                          <div className={`text-lg font-bold ${getCorrelationColor(correlation.correlation)}`}>
                            {correlation.correlation > 0 ? '+' : ''}{correlation.correlation.toFixed(3)}
                          </div>
                        </div>
                        
                        <Progress 
                          value={Math.abs(correlation.correlation) * 100} 
                          className="mb-2"
                          variant={correlation.direction === 'positive' ? 'success' : 'warning'}
                        />
                        
                        <p className="text-sm text-muted-foreground">
                          {correlation.insights}
                        </p>
                      </CardContent>
                    </Card>
                  ))}

                  {correlationData.topCorrelations.length === 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        No significant correlations found. Try increasing the date range or ensure you have consistent data logging across different metrics.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="all">
                <div className="space-y-3">
                  {correlationData.correlations.slice(0, 20).map((correlation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {formatMetricName(correlation.metric1)} ↔ {formatMetricName(correlation.metric2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {correlation.strength} {correlation.direction} correlation
                        </div>
                      </div>
                      <div className={`text-sm font-mono ${getCorrelationColor(correlation.correlation)}`}>
                        {correlation.correlation.toFixed(3)}
                      </div>
                    </div>
                  ))}
                  
                  {correlationData.correlations.length > 20 && (
                    <div className="text-center text-sm text-muted-foreground pt-4">
                      Showing top 20 of {correlationData.correlations.length} correlations
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {correlationData.summary.strongestPositive && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Strongest positive correlation:</strong> {' '}
                  {formatMetricName(correlationData.summary.strongestPositive.metric1)} and {' '}
                  {formatMetricName(correlationData.summary.strongestPositive.metric2)} {' '}
                  (r = {correlationData.summary.strongestPositive.correlation.toFixed(3)})
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};