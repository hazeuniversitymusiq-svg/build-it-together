import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Link2, ShieldOff, ChevronRight } from "lucide-react";

interface PermissionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: "read" | "link" | "never";
  delay: number;
}

const PermissionItem = ({ icon, title, description, type, delay }: PermissionItemProps) => {
  const typeStyles = {
    read: "bg-accent/10 text-accent",
    link: "bg-success/10 text-success",
    never: "bg-muted text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-start gap-4 py-4"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeStyles[type]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

const PermissionsPage = () => {
  const navigate = useNavigate();

  const permissions = [
    {
      icon: <Eye className="w-5 h-5" />,
      title: "What FLOW reads",
      description: "Payment requests from merchants. Nothing else enters unless you approve it.",
      type: "read" as const,
    },
    {
      icon: <Link2 className="w-5 h-5" />,
      title: "What FLOW links",
      description: "Your existing payment apps and bank accounts. We connect, we never store.",
      type: "link" as const,
    },
    {
      icon: <ShieldOff className="w-5 h-5" />,
      title: "What FLOW never touches",
      description: "Your money. Your credentials. Your balances. We orchestrate—you hold.",
      type: "never" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-16 pb-8"
      >
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
          Before we begin
        </h1>
        <p className="text-muted-foreground">
          Trust precedes everything.
        </p>
      </motion.div>

      {/* Permission Items */}
      <div className="flex-1">
        <div className="divide-y divide-border">
          {permissions.map((permission, index) => (
            <PermissionItem
              key={permission.title}
              {...permission}
              delay={0.2 + index * 0.15}
            />
          ))}
        </div>

        {/* Product Truth Statement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 p-4 rounded-2xl bg-muted/50"
        >
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            FLOW acts only with your explicit authorisation.
            <br />
            Every action requires your consent.
          </p>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="py-8 space-y-3"
      >
        <Button
          onClick={() => navigate("/auth")}
          className="w-full h-14 text-base font-medium rounded-2xl"
        >
          I understand
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        
        <button
          onClick={() => navigate("/")}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Go back
        </button>
      </motion.div>
    </div>
  );
};

export default PermissionsPage;
