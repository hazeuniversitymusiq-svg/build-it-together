import { motion } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import { 
  Wallet, 
  Shield, 
  Bell, 
  Fingerprint, 
  HelpCircle, 
  ChevronRight,
  Smartphone,
  CreditCard,
  LogOut
} from "lucide-react";

const SettingsPage = () => {
  const paymentMethods = [
    { id: "1", name: "Touch 'n Go", icon: "🔵", connected: true, isDefault: true },
    { id: "2", name: "DuitNow", icon: "🟢", connected: true, isDefault: false },
    { id: "3", name: "Maybank", icon: "🟡", connected: true, isDefault: false },
    { id: "4", name: "GrabPay", icon: "🟠", connected: false, isDefault: false },
  ];

  const settingsGroups = [
    {
      title: "Security",
      items: [
        { icon: Fingerprint, label: "Biometrics", value: "Face ID", action: true },
        { icon: Shield, label: "Transaction Limits", value: "RM 5,000/day", action: true },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", value: "On", action: true },
        { icon: Smartphone, label: "Default Payment", value: "Touch 'n Go", action: true },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", action: true },
      ],
    },
  ];

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full safe-area-top">
        {/* Header */}
        <header className="px-6 pt-4 pb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your FLOW experience</p>
        </header>

        {/* Payment Stack */}
        <section className="px-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">Payment Stack</h2>
            <button className="text-sm text-accent font-medium">Manage</button>
          </div>
          <div className="bg-card rounded-2xl overflow-hidden flow-card-shadow">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 ${
                  index !== paymentMethods.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg">
                  {method.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{method.name}</p>
                  {method.isDefault && (
                    <span className="text-xs text-accent">Default</span>
                  )}
                </div>
                <div className={`w-2 h-2 rounded-full ${method.connected ? "bg-success" : "bg-muted"}`} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Settings Groups */}
        <div className="px-6 pb-6 space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <section key={group.title}>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">{group.title}</h2>
              <div className="bg-card rounded-2xl overflow-hidden">
                {group.items.map((item, index) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                    className={`w-full flex items-center gap-4 p-4 text-left ${
                      index !== group.items.length - 1 ? "border-b border-border/50" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <item.icon size={20} className="text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && (
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                      )}
                      {item.action && (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
          ))}

          {/* Sign Out */}
          <button className="w-full flex items-center justify-center gap-2 py-4 text-destructive font-medium">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>

          {/* Version */}
          <p className="text-center text-xs text-muted-foreground">
            FLOW v1.0.0
          </p>
        </div>
      </div>
    </MobileShell>
  );
};

export default SettingsPage;
