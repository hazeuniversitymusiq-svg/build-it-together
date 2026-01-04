import { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface MobileShellProps {
  children: ReactNode;
  showNav?: boolean;
}

const MobileShell = ({ children, showNav = true }: MobileShellProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto relative">
      <main className="flex-1 overflow-auto pb-20">{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default MobileShell;
