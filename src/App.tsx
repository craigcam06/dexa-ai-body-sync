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
    backgroundColor: 'white', 
    color: 'black', 
    padding: '20px', 
    fontSize: '24px',
    minHeight: '100vh'
  }}>
    <h1>MOBILE TEST - App Loading...</h1>
    <p>If you can see this, React is working!</p>
    <p>Debugging the black screen issue...</p>
  </div>
);

export default App;
