import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import AuthCallback from "./pages/AuthCallback";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <div style={{ 
    backgroundColor: 'red', 
    color: 'white', 
    padding: '20px', 
    fontSize: '24px',
    minHeight: '100vh'
  }}>
    <h1>MOBILE TEST - Can you see this?</h1>
    <p>If you can see this red screen, React is working!</p>
  </div>
);

export default App;
