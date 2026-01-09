/**
 * AppLayout - Shared layout for authenticated app screens
 * 
 * Provides consistent BottomNav navigation across all authenticated routes
 * with proper padding and safe area handling
 */

import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      {/* Main content area with bottom padding for nav */}
      <main className="pb-24">
        <Outlet />
      </main>
      
      {/* Shared bottom navigation */}
      <BottomNav />
    </div>
  );
};

export default AppLayout;
