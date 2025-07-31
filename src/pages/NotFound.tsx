import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-card">
        <CardHeader className="space-y-4">
          <div className="w-16 h-16 bg-muted/20 rounded-xl flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-display">404</CardTitle>
            <p className="text-muted-foreground">This page doesn't exist</p>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full btn-interactive">
            <a href="/" className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Return to Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
