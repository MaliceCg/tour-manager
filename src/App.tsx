import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import ActivitiesPage from "./pages/ActivitiesPage";
import SchedulePage from "./pages/SchedulePage";
import CalendarPage from "./pages/CalendarPage";
import ReservationsPage from "./pages/ReservationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/activities" replace />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="schedule/:activityId" element={<SchedulePage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
