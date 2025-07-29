import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        // Redirect back to main page with error
        setTimeout(() => navigate('/?auth=error'), 2000);
        return;
      }

      if (code) {
        // The WhoopConnect component will handle this code
        // Just redirect to main page and let it process
        navigate('/?code=' + code);
      } else {
        // No code or error, redirect to main page
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing Whoop Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please wait while we complete your Whoop connection...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;