import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export function StatsCard({ title, value, icon, description, className }: StatsCardProps) {
  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-gray-100 p-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-[#1a1a2e] mt-1">{value}</p>
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 bg-[#1a1a2e]/10 rounded-lg flex items-center justify-center text-[#1a1a2e]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
