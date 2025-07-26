import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  UserCheck, 
  Building, 
  Bus, 
  Upload, 
  Database,
  User,
  MessageSquare,
  CreditCard,
  Users
} from "lucide-react";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const isSuperAdmin = user?.role === 'super_admin';

  const superAdminNavItems = [
    { 
      href: "/admin/dashboard", 
      icon: LayoutDashboard, 
      label: "Dashboard" 
    },
    { 
      href: "/admin/agency-approval", 
      icon: UserCheck, 
      label: "Agency Approval" 
    },
    { 
      href: "/admin/manage-agencies", 
      icon: Building, 
      label: "Manage Agencies" 
    },
    { 
      href: "/admin/user-data", 
      icon: Users, 
      label: "User Data" 
    },
    { 
      href: "/admin/accounts", 
      icon: Database, 
      label: "Accounts" 
    },
    { 
      href: "/admin/profile", 
      icon: User, 
      label: "Profile" 
    },
    { 
      href: "/admin/whatsapp-config", 
      icon: MessageSquare, 
      label: "WhatsApp Config" 
    },
    { 
      href: "/admin/whatsapp-testing", 
      icon: MessageSquare, 
      label: "WhatsApp Testing" 
    },
  ];

  const agencyNavItems = [
    { 
      href: "/agency/dashboard", 
      icon: LayoutDashboard, 
      label: "Dashboard" 
    },
    { 
      href: "/agency/bus-management", 
      icon: Bus, 
      label: "Bus Management" 
    },
    { 
      href: "/agency/upload-data", 
      icon: Upload, 
      label: "Upload Traveler Data" 
    },
    { 
      href: "/agency/uploaded-data", 
      icon: Database, 
      label: "Uploaded Data" 
    },
    { 
      href: "/agency/payments",
      icon: CreditCard,
      label: "Payments"
    },
    { 
      href: "/agency/profile", 
      icon: User, 
      label: "Profile" 
    },
    { 
      href: "/agency/whatsapp-schedule", 
      icon: MessageSquare, 
      label: "WhatsApp Schedule" 
    },
  ];

  const navItems = isSuperAdmin ? superAdminNavItems : agencyNavItems;

  return (
    <nav className="bg-white w-64 min-h-screen border-r border-[var(--airbnb-border)]">
      <div className="p-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (location === "/" && item.href.includes("dashboard"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "text-[var(--airbnb-primary)] bg-red-50" 
                    : "text-[var(--airbnb-dark)] hover:bg-[var(--airbnb-light)]"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}