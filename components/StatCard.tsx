import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = 'text-slate-500',
  iconBg = 'bg-slate-100',
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      {Icon && (
        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${iconBg} mb-4`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      )}
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
