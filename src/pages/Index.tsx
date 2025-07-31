import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { HealthDashboard } from "@/components/HealthDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-black p-8">
      <h1 className="text-4xl font-bold mb-4">Health Sync App</h1>
      <p className="text-lg mb-4">Welcome to your health dashboard!</p>
      <div className="bg-blue-100 p-4 rounded">
        <p>This is a test to ensure the app is working properly.</p>
      </div>
    </div>
  );
};

export default Index;
