import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { HealthDashboard } from "@/components/HealthDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut } from "lucide-react";

const Index = () => {
  // Temporary bypass auth for debugging
  return (
    <div style={{ 
      backgroundColor: 'white', 
      color: 'black', 
      padding: '20px', 
      fontSize: '24px',
      minHeight: '100vh'
    }}>
      <h1>TESTING - Can you see this?</h1>
      <p>White background, black text</p>
      <p>This should be visible on iPhone</p>
    </div>
  );
};

export default Index;
