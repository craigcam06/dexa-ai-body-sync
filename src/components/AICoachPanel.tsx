import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain, MessageSquare, Send, Heart, Moon, Dumbbell, Activity, Apple, TrendingUp, Target, Zap, Calendar, BarChart3, HelpCircle } from 'lucide-react';
import { ParsedWhoopData } from '@/types/whoopData';
import { supabase } from '@/integrations/supabase/client';

interface AICoachPanelProps {
  whoopData?: ParsedWhoopData;
  planData?: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AICoachPanel({ whoopData, planData }: AICoachPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate AI response
  const generateAIResponse = async (question: string, healthData?: ParsedWhoopData, planInfo?: any): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-health-coach', {
        body: {
          message: question,
          healthData: healthData,
          planData: planInfo
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

  // Enhanced quick action categories
  const quickActionCategories = [
    {
      title: "🔄 Recovery & Performance",
      actions: [
        {
          question: planData ? 
            "Should I train fasted today based on my plan and recovery?" :
            "How's my recovery trending this week?",
          icon: TrendingUp,
          color: "text-red-500",
          description: planData ? "Craig Campbell protocol guidance" : "Deep dive into HRV, RHR patterns"
        },
        {
          question: planData ? 
            "Should I modify today's workout based on my WHOOP data?" :
            "Should I train hard today or focus on active recovery?",
          icon: Target,
          color: "text-orange-500",
          description: planData ? "Plan-specific training adjustments" : "Training recommendations based on current metrics"
        },
        {
          question: "What are the correlations between my sleep and recovery?",
          icon: BarChart3,
          color: "text-pink-500",
          description: "Identify patterns affecting performance"
        }
      ]
    },
    {
      title: "💤 Sleep Optimization",
      actions: [
        {
          question: planData ? 
            "Optimize my sleep for the Craig Campbell protocol" :
            "Create a personalized sleep optimization plan based on my data",
          icon: Moon,
          color: "text-purple-500",
          description: planData ? "7:30 PM cutoff & recovery optimization" : "Bedtime, wake time, environment tips"
        },
        {
          question: "Why is my sleep efficiency low and how can I improve it?",
          icon: Zap,
          color: "text-indigo-500",
          description: "Detailed sleep quality analysis"
        },
        {
          question: "How does my sleep debt affect my training performance?",
          icon: Calendar,
          color: "text-blue-400",
          description: "Sleep-performance relationship insights"
        }
      ]
    },
    {
      title: "🏋️ Training & Strength",
      actions: [
        {
          question: planData ? 
            "Design my workout schedule around my Craig Campbell plan" :
            "Design a week of workouts based on my current fitness level",
          icon: Dumbbell,
          color: "text-blue-500",
          description: planData ? "A/B/C/D/E rotation optimization" : "Personalized workout programming"
        },
        {
          question: "Analyze my strength progression and suggest next steps",
          icon: TrendingUp,
          color: "text-cyan-500",
          description: "StrongLifts data analysis & progression"
        },
        {
          question: "How should I adjust my training based on strain and recovery?",
          icon: Activity,
          color: "text-green-500",
          description: "Load management recommendations"
        }
      ]
    },
    {
      title: "🥗 Nutrition & Lifestyle",
      actions: [
        {
          question: planData ? 
            "Optimize my macros for today based on my plan and WHOOP data" :
            "Create a nutrition plan to support my training goals",
          icon: Apple,
          color: "text-green-600",
          description: planData ? "230-250g protein, carb cycling" : "Macro targets, meal timing, supplements"
        },
        {
          question: "What lifestyle factors are impacting my recovery?",
          icon: Heart,
          color: "text-red-400",
          description: "Stress, hydration, lifestyle optimization"
        },
        {
          question: "How can I optimize my pre and post-workout nutrition?",
          icon: Zap,
          color: "text-yellow-500",
          description: "Performance nutrition strategies"
        }
      ]
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
      const response = await generateAIResponse(messageToSend, whoopData, planData);
      
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

  return (
    <div className="space-y-6">
      {/* AI Chat - Ultra-Clean */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <span className="font-display">AI Health Coach</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Personal Health Intelligence</div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p>• Analyzes your health data patterns</p>
                        <p>• Provides personalized recommendations</p>
                        <p>• Adapts to your specific protocols</p>
                        <p>• Available 24/7 for health questions</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardTitle>
          <CardDescription className="text-sm">
            Personalized insights from your health data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Streamlined Quick Actions */}
          {whoopData && chatMessages.length === 0 && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  {planData ? '🎯 Protocol Coaching Ready' : '🤖 Health Intelligence Ready'}
                </p>
                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span>Recovery</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Moon className="h-3 w-3 text-purple-500" />
                    <span>Sleep</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3 text-blue-500" />
                    <span>Training</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Apple className="h-3 w-3 text-green-500" />
                    <span>Nutrition</span>
                  </div>
                </div>
              </div>
              
              {quickActionCategories.map((category) => (
                <div key={category.title} className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{category.title}</h3>
                  <div className="grid grid-cols-1 gap-1">
                    {category.actions.map((action) => (
                      <Button
                        key={action.question}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickAction(action.question)}
                        className="text-left justify-start h-auto p-3 hover:bg-muted/50 transition-colors"
                        disabled={isAnalyzing}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <action.icon className={`h-4 w-4 ${action.color} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-medium leading-tight">{action.question}</p>
                            <p className="text-xs text-muted-foreground leading-tight">{action.description}</p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isAnalyzing && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      <span className="text-sm text-muted-foreground">AI is analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
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

          {/* Enhanced No Data Prompt */}
          {!whoopData && (
            <div className="text-center py-8 text-muted-foreground space-y-4">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <div className="space-y-2">
                <p className="font-medium">🚀 Unlock Your Personal AI Health Coach</p>
                <p className="text-sm">Upload your health data to get:</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs max-w-md mx-auto">
                <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                  <Heart className="h-4 w-4 mx-auto text-red-500" />
                  <p className="font-medium">Recovery Analysis</p>
                  <p>HRV trends & readiness</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                  <Moon className="h-4 w-4 mx-auto text-purple-500" />
                  <p className="font-medium">Sleep Optimization</p>
                  <p>Quality & efficiency tips</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                  <Dumbbell className="h-4 w-4 mx-auto text-blue-500" />
                  <p className="font-medium">Training Plans</p>
                  <p>Personalized workouts</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                  <Apple className="h-4 w-4 mx-auto text-green-500" />
                  <p className="font-medium">Nutrition Advice</p>
                  <p>Fuel your performance</p>
                </div>
              </div>
              <p className="text-xs mt-4">Upload CSV data or connect Whoop to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}