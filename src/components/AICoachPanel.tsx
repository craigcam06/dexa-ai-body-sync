import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, MessageSquare, Send, Sparkles, Download, Heart, Moon, Dumbbell, Activity, Target } from 'lucide-react';
import { ParsedWhoopData } from '@/types/whoopData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AICoachPanelProps {
  whoopData?: ParsedWhoopData;
}

interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  metric?: string;
  value?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AICoachPanel({ whoopData }: AICoachPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (whoopData) {
      generateInsights();
    }
  }, [whoopData]);

  const generateInsights = () => {
    if (!whoopData) return;

    const newInsights: Insight[] = [];

    // Recovery insights
    if (whoopData.recovery.length > 0) {
      const latestRecovery = whoopData.recovery[whoopData.recovery.length - 1];
      const avgRecovery = whoopData.recovery.reduce((sum, r) => sum + r.recovery_score, 0) / whoopData.recovery.length;
      
      if (latestRecovery.recovery_score > avgRecovery + 10) {
        newInsights.push({
          type: 'success',
          title: 'Excellent Recovery',
          message: `Your latest recovery score of ${latestRecovery.recovery_score}% is ${Math.round(latestRecovery.recovery_score - avgRecovery)}% above your average. Great job!`,
          metric: 'Recovery',
          value: latestRecovery.recovery_score
        });
      } else if (latestRecovery.recovery_score < avgRecovery - 10) {
        newInsights.push({
          type: 'warning',
          title: 'Recovery Needs Attention',
          message: `Your latest recovery score of ${latestRecovery.recovery_score}% is below your average. Consider prioritizing sleep and stress management.`,
          metric: 'Recovery',
          value: latestRecovery.recovery_score
        });
      }

      // HRV insights
      const avgHRV = whoopData.recovery.reduce((sum, r) => sum + r.hrv_rmssd_milli, 0) / whoopData.recovery.length;
      if (latestRecovery.hrv_rmssd_milli > avgHRV * 1.1) {
        newInsights.push({
          type: 'success',
          title: 'High HRV',
          message: 'Your heart rate variability is above average, indicating good autonomic nervous system balance.',
          metric: 'HRV',
          value: latestRecovery.hrv_rmssd_milli
        });
      }
    }

    // Sleep insights
    if (whoopData.sleep.length > 0) {
      const latestSleep = whoopData.sleep[whoopData.sleep.length - 1];
      const avgEfficiency = whoopData.sleep.reduce((sum, s) => sum + s.sleep_efficiency_percentage, 0) / whoopData.sleep.length;
      
      if (latestSleep.sleep_efficiency_percentage < 80) {
        newInsights.push({
          type: 'warning',
          title: 'Sleep Efficiency Low',
          message: `Your sleep efficiency of ${latestSleep.sleep_efficiency_percentage}% is below optimal. Aim for 85%+ for better recovery.`,
          metric: 'Sleep Efficiency',
          value: latestSleep.sleep_efficiency_percentage
        });
      }

      const totalSleepHours = latestSleep.total_sleep_time_milli / (1000 * 60 * 60);
      if (totalSleepHours < 7) {
        newInsights.push({
          type: 'warning',
          title: 'Insufficient Sleep',
          message: `You only got ${totalSleepHours.toFixed(1)} hours of sleep. Aim for 7-9 hours for optimal performance.`,
          metric: 'Sleep Duration',
          value: totalSleepHours
        });
      }
    }

    // Workout insights
    if (whoopData.workouts.length > 0) {
      const weeklyStrain = whoopData.workouts
        .slice(-7)
        .reduce((sum, w) => sum + w.strain_score, 0);
      
      if (weeklyStrain > 70) {
        newInsights.push({
          type: 'warning',
          title: 'High Training Load',
          message: `Your weekly strain of ${weeklyStrain.toFixed(1)} is quite high. Consider adding more recovery days.`,
          metric: 'Weekly Strain',
          value: weeklyStrain
        });
      }
    }

    setInsights(newInsights);
  };


  const generateAIResponse = async (question: string, healthData?: ParsedWhoopData): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-health-coach', {
        body: {
          message: question,
          healthData: healthData
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data.response;
    } catch (error) {
      console.error('Error calling AI coach:', error);
      return "I'm having trouble connecting to the AI service right now. Please try again in a moment.";
    }
  };

  // Calculate overall health score
  const calculateHealthScore = (): number => {
    if (!whoopData) return 0;
    
    let score = 0;
    let factors = 0;

    // Recovery score (30% weight)
    if (whoopData.recovery?.length > 0) {
      const latestRecovery = whoopData.recovery[whoopData.recovery.length - 1];
      score += (latestRecovery.recovery_score / 100) * 30;
      factors += 30;
    }

    // Sleep efficiency (25% weight)
    if (whoopData.sleep?.length > 0) {
      const latestSleep = whoopData.sleep[whoopData.sleep.length - 1];
      score += (latestSleep.sleep_efficiency_percentage / 100) * 25;
      factors += 25;
    }

    // Training load balance (20% weight)
    if (whoopData.workouts?.length > 0) {
      const weeklyStrain = whoopData.workouts
        .slice(-7)
        .reduce((sum, w) => sum + w.strain_score, 0);
      // Optimal strain is around 50-70 for the week
      const strainScore = weeklyStrain > 70 ? Math.max(0, 100 - (weeklyStrain - 70)) : Math.min(100, weeklyStrain * 1.5);
      score += (strainScore / 100) * 20;
      factors += 20;
    }

    // StrongLifts consistency (15% weight)
    if (whoopData.stronglifts?.length > 0) {
      const recentWorkouts = whoopData.stronglifts.filter(w => {
        const workoutDate = new Date(w.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return workoutDate >= weekAgo;
      });
      const consistencyScore = Math.min(100, (recentWorkouts.length / 3) * 100); // 3 workouts per week is ideal
      score += (consistencyScore / 100) * 15;
      factors += 15;
    }

    // HRV trend (10% weight)
    if (whoopData.recovery?.length > 1) {
      const recent = whoopData.recovery.slice(-7);
      const avgHRV = recent.reduce((sum, r) => sum + r.hrv_rmssd_milli, 0) / recent.length;
      const latestHRV = recent[recent.length - 1].hrv_rmssd_milli;
      const hrvScore = latestHRV >= avgHRV ? 100 : Math.max(0, (latestHRV / avgHRV) * 100);
      score += (hrvScore / 100) * 10;
      factors += 10;
    }

    return factors > 0 ? Math.round(score) : 0;
  };

  // Quick action questions
  const quickActions = [
    {
      question: "How's my recovery trending this week?",
      icon: Heart,
      color: "text-red-500"
    },
    {
      question: "Should I work out today based on my data?",
      icon: Dumbbell,
      color: "text-blue-500"
    },
    {
      question: "Analyze my sleep patterns and give improvement tips",
      icon: Moon,
      color: "text-purple-500"
    },
    {
      question: "What's my training load balance looking like?",
      icon: Activity,
      color: "text-green-500"
    }
  ];

  const handleQuickAction = async (question: string) => {
    await handleSendMessage(question);
  };

  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || userInput;
    if (!messageToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    if (!customMessage) setUserInput('');
    setIsAnalyzing(true);

    try {
      const response = await generateAIResponse(messageToSend, whoopData);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export data function
  const exportHealthData = () => {
    if (!whoopData) {
      toast({
        title: "No Data Available",
        description: "Please upload your health data first to export it.",
        variant: "destructive",
      });
      return;
    }

    const dataToExport = {
      exportDate: new Date().toISOString(),
      healthScore: calculateHealthScore(),
      recovery: whoopData.recovery,
      sleep: whoopData.sleep,
      workouts: whoopData.workouts,
      stronglifts: whoopData.stronglifts,
      insights: insights,
      chatHistory: chatMessages
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Your health data has been downloaded successfully.",
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default: return <TrendingUp className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const healthScore = calculateHealthScore();

  return (
    <div className="space-y-6">
      {/* Health Score */}
      {whoopData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Health Score
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportHealthData}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{healthScore}</div>
                <div className="text-sm text-muted-foreground mb-4">
                  {healthScore >= 80 ? "Excellent" : 
                   healthScore >= 70 ? "Good" : 
                   healthScore >= 60 ? "Fair" : "Needs Attention"}
                </div>
                <div className="w-32 bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your biometric data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge className={getInsightBadgeColor(insight.type)}>
                        {insight.metric}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Upload your Whoop data to get personalized insights</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI Health Coach
          </CardTitle>
          <CardDescription>
            Ask questions about your health data and get personalized advice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          {whoopData && chatMessages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Quick Health Insights:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.question}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.question)}
                    className="text-left justify-start h-auto p-3 flex items-center gap-2"
                    disabled={isAnalyzing}
                  >
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                    <span className="text-xs">{action.question}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask about your recovery, sleep patterns, training load, or any health-related question..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1"
              rows={2}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!userInput.trim() || isAnalyzing}
              size="sm"
              className="self-end"
            >
              {isAnalyzing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Back to Quick Actions */}
          {chatMessages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChatMessages([])}
              className="w-full text-muted-foreground"
            >
              ← Back to Quick Actions
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}