import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Settings } from 'lucide-react';
import { ParsedWhoopData } from '@/types/whoopData';
import { useToast } from '@/hooks/use-toast';

interface VoiceInterfaceProps {
  whoopData?: ParsedWhoopData;
}

export function VoiceInterface({ whoopData }: VoiceInterfaceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const { toast } = useToast();

  const startVoiceSession = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus('connecting');
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Simulate ElevenLabs voice agent connection
      // In a real implementation, this would connect to ElevenLabs API
      setTimeout(() => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setIsListening(true);
        setIsLoading(false);
        
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Voice Chat Connected",
          description: "AI health coach is ready to talk! Start speaking...",
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error starting voice session:', error);
      setIsLoading(false);
      setConnectionStatus('disconnected');
      
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice chat.",
        variant: "destructive",
      });
    }
  };

  const endVoiceSession = () => {
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setIsSpeaking(false);
    setIsListening(false);
    
    toast({
      title: "Voice Chat Ended",
      description: "AI health coach session has ended.",
    });
  };

  const toggleMute = () => {
    setIsListening(!isListening);
    toast({
      title: isListening ? "Muted" : "Unmuted",
      description: isListening ? "Microphone muted" : "Microphone active",
    });
  };

  // Simulate voice activity detection
  useEffect(() => {
    if (isConnected && isListening) {
      const interval = setInterval(() => {
        // Randomly simulate speaking activity for demo
        if (Math.random() > 0.8) {
          setIsSpeaking(true);
          setTimeout(() => setIsSpeaking(false), 2000 + Math.random() * 3000);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isConnected, isListening]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      default: return 'Disconnected';
    }
  };

  if (!whoopData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Chat with AI Coach
          </CardTitle>
          <CardDescription>
            Have natural conversations about your health data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-4">Upload your health data to unlock voice coaching</p>
            <p className="text-sm">The AI coach can provide spoken insights and answer your questions naturally</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Chat with AI Coach
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {getStatusText()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Natural voice conversations about your health metrics and insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <Mic className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Start Voice Coaching Session</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Talk naturally with your AI health coach about your recovery, sleep, and training data
              </p>
              
              <Button 
                onClick={startVoiceSession}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Start Voice Chat
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">What you can ask:</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  "How's my recovery trending this week?"
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  "Should I work out today based on my data?"
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  "Give me sleep improvement tips"
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  "What's my training load balance?"
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Voice Activity Indicator */}
            <div className="text-center">
              <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                isSpeaking 
                  ? 'bg-gradient-to-br from-green-400 to-green-600 animate-pulse' 
                  : isListening 
                    ? 'bg-gradient-to-br from-primary/40 to-primary/20 animate-pulse' 
                    : 'bg-gradient-to-br from-gray-200 to-gray-300'
              }`}>
                {isSpeaking ? (
                  <Volume2 className="h-8 w-8 text-white" />
                ) : isListening ? (
                  <Mic className="h-8 w-8 text-primary" />
                ) : (
                  <MicOff className="h-8 w-8 text-gray-500" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">
                  {isSpeaking ? 'AI Coach is speaking...' : 
                   isListening ? 'Listening...' : 'Muted'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isSpeaking ? 'Getting insights about your health data' :
                   isListening ? 'Ask me anything about your recovery, sleep, or training' :
                   'Microphone is muted'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button
                variant={isListening ? "default" : "outline"}
                size="lg"
                onClick={toggleMute}
                className="flex items-center gap-2"
              >
                {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                {isListening ? 'Mute' : 'Unmute'}
              </Button>
              
              <Button
                variant="destructive"
                size="lg"
                onClick={endVoiceSession}
                className="flex items-center gap-2"
              >
                <PhoneOff className="h-4 w-4" />
                End Call
              </Button>
            </div>

            {/* Session Info */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Session Status</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Voice Model</span>
                <span className="font-medium">ElevenLabs Turbo</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Health Data</span>
                <span className="font-medium">
                  {whoopData.recovery?.length || 0} recovery, {whoopData.sleep?.length || 0} sleep records
                </span>
              </div>
            </div>

            {/* Tips */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 <strong>Tip:</strong> Speak naturally - the AI understands context about your health data</p>
              <p>🎯 <strong>Try:</strong> "Compare this week's recovery to last week" or "What should I focus on?"</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}