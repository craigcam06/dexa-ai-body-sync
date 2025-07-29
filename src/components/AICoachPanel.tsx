import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, MessageSquare, Send, Heart, Moon, Dumbbell, Activity } from 'lucide-react';
import { ParsedWhoopData } from '@/types/whoopData';
import { supabase } from '@/integrations/supabase/client';

interface AICoachPanelProps {
  whoopData?: ParsedWhoopData;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AICoachPanel({ whoopData }: AICoachPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate AI response
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

  return (
    <div className="space-y-6">
      {/* AI Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
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
              <p className="text-sm font-medium text-muted-foreground">Quick Health Questions:</p>
              <div className="grid grid-cols-1 gap-2">
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
                    <span className="text-sm">{action.question}</span>
                  </Button>
                ))}
              </div>
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

          {/* No Data Prompt */}
          {!whoopData && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-4">Upload your health data to unlock personalized AI coaching</p>
              <p className="text-sm">The AI coach can analyze your recovery, sleep, and training patterns to provide targeted advice.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}