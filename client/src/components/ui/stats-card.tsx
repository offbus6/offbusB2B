import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  value: string | number;
  className?: string;
}

export default function StatsCard({ 
  icon: Icon, 
  iconColor, 
  title, 
  value, 
  className = "" 
}: StatsCardProps) {
  return (
    <Card className={`airbnb-shadow hover-lift ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${iconColor} bg-opacity-10`}>
            <Icon className={`text-xl ${iconColor}`} />
          </div>
          <div className="ml-4">
            <p className="text-[var(--airbnb-gray)] text-sm">{title}</p>
            <p className="text-2xl font-bold text-[var(--airbnb-dark)]">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
