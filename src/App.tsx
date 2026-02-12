import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BadgeProvider } from "@/contexts/BadgeContext";
import Index from "./pages/Index";
import PracticeSession from "./pages/PracticeSession";
import SoundQuest from "./pages/SoundQuest";
import Badges from "./pages/Badges";
import ParentDashboard from "./pages/ParentDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BadgeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/practice" element={<PracticeSession />} />
            <Route path="/sound-quest" element={<SoundQuest />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BadgeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
