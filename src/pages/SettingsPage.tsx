import { motion } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import { ChevronRight } from "lucide-react";

const SettingsPage = () => {
  const paymentMethods = [
    { id: "1", name: "Touch 'n Go", connected: true },
    { id: "2", name: "DuitNow", connected: true },
    { id: "3", name: "Maybank", connected: true },
    { id: "4", name: "GrabPay", connected: false },
  ];

  const settings = [
    { label: "Face ID", value: "On" },
    { label: "Notifications", value: "On" },
    { label: "Daily Limit", value: "RM 5,000" },
  ];

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full">
        {/* Minimal Header */}
        <header className="px-6 pt-8 pb-6 safe-area-top">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Settings</h1>
        </header>

        {/* Payment Methods - Confident list */}
        <section className="px-6 mb-8">
          <p className="text-sm text-muted-foreground mb-4">Payment Methods</p>
          <div className="space-y-0 divide-y divide-border/50">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between py-4"
              >
                <span className="text-foreground">{method.name}</span>
                <div className={`w-2 h-2 rounded-full ${method.connected ? "bg-success" : "bg-muted-foreground/30"}`} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Preferences - Simple rows */}
        <section className="px-6 mb-8">
          <p className="text-sm text-muted-foreground mb-4">Preferences</p>
          <div className="space-y-0 divide-y divide-border/50">
            {settings.map((setting, index) => (
              <motion.button
                key={setting.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="w-full flex items-center justify-between py-4"
              >
                <span className="text-foreground">{setting.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{setting.value}</span>
                  <ChevronRight size={16} className="text-muted-foreground/50" />
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sign Out - Minimal */}
        <div className="px-6 pb-8">
          <button className="w-full py-4 text-destructive text-center">
            Sign Out
          </button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            FLOW 1.0
          </p>
        </div>
      </div>
    </MobileShell>
  );
};

export default SettingsPage;
