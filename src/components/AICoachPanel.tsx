import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, MessageSquare, Send, Sparkles } from 'lucide-react';
import { ParsedWhoopData } from '@/types/whoopData';

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
  const [apiKey, setApiKey] = useState('');

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

  const handleSendMessage = async () => {
    if (!userInput.trim() || !apiKey) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsAnalyzing(true);

    try {
      // Generate AI response based on data
      const response = await generateAIResponse(userInput, whoopData);
      
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

  const generateAIResponse = async (question: string, data?: ParsedWhoopData): Promise<string> => {
    // Create context from data
    let context = "You are a health and fitness coach analyzing biometric data. ";
    
    if (data) {
      if (data.recovery.length > 0) {
        const latest = data.recovery[data.recovery.length - 1];
        context += `Latest recovery: ${latest.recovery_score}%, HRV: ${latest.hrv_rmssd_milli}ms, RHR: ${latest.resting_heart_rate}bpm. `;
      }
      
      if (data.sleep.length > 0) {
        const latest = data.sleep[data.sleep.length - 1];
        const hours = (latest.total_sleep_time_milli / (1000 * 60 * 60)).toFixed(1);
        context += `Latest sleep: ${hours}h total, ${latest.sleep_efficiency_percentage}% efficiency. `;
      }
      
      if (data.workouts.length > 0) {
        const latest = data.workouts[data.workouts.length - 1];
        context += `Latest workout: ${latest.workout_type}, strain ${latest.strain_score}. `;
      }
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: context + "Provide helpful, personalized advice based on the data. Keep responses concise and actionable."
            },
            {
              role: 'user',
              content: question
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      return "I apologize, but I'm having trouble accessing the AI service. Please check your API key and try again.";
    }
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

  return (
    <div className="space-y-6">
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
          {/* API Key Input */}
          {!apiKey && (
            <div className="space-y-2">
              <label className="text-sm font-medium">OpenAI API Key</label>
              <Input
                type="password"
                placeholder="Enter your OpenAI API key to enable AI coaching"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and used only for generating personalized advice
              </p>
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
          {apiKey && (
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
                onClick={handleSendMessage}
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
          )}

          {/* Sample Questions */}
          {chatMessages.length === 0 && apiKey && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "How's my recovery trending?",
                "Should I train today?",
                "What can improve my sleep?",
                "Analyze my training load"
              ].map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  onClick={() => setUserInput(question)}
                  className="text-left justify-start h-auto p-2"
                >
                  {question}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}