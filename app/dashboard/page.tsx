import StatCard from '@/components/StatCard';
import { query } from '@/lib/db';
import { Building2, Users, TrendingUp, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

async function getStats() {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [buildings, customers, monthStats, expectedRow] = await Promise.all([
      query('SELECT COUNT(*) AS total_buildings FROM buildings'),
      query('SELECT COUNT(*) AS total_customers FROM customers'),
      query(
        `SELECT
           COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) AS total_collected,
           COUNT(CASE WHEN p.status = 'paid' THEN 1 END) AS num_paid
         FROM payments p
         WHERE p.month = $1 AND p.year = $2`,
        [month, year],
      ),
      query('SELECT COALESCE(SUM(monthly_fee), 0) AS total_expected FROM customers'),
    ]);

    return {
      total_buildings: Number(buildings.rows[0]?.total_buildings ?? 0),
      total_customers: Number(customers.rows[0]?.total_customers ?? 0),
      total_collected_this_month: Number(monthStats.rows[0]?.total_collected ?? 0),
      total_expected_this_month: Number(expectedRow.rows[0]?.total_expected ?? 0),
      num_paid_this_month: Number(monthStats.rows[0]?.num_paid ?? 0),
    };
  } catch {
    return null;
  }
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default async function DashboardPage() {
  const stats = await getStats();
  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">{monthLabel} overview</p>
      </div>

      {!stats ? (
        <div className="bg-white rounded-2xl border border-red-100 p-6 text-red-500 text-sm">
          Failed to load stats. Check your database connection.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Buildings"
            value={stats.total_buildings}
            icon={Building2}
            iconColor="text-blue-500"
            iconBg="bg-blue-50"
          />
          <StatCard
            label="Total Customers"
            value={stats.total_customers}
            icon={Users}
            iconColor="text-slate-500"
            iconBg="bg-slate-100"
          />
          <StatCard
            label="Collected This Month"
            value={`KES ${Number(stats.total_collected_this_month).toLocaleString()}`}
            icon={TrendingUp}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50"
          />
          <StatCard
            label="Expected This Month"
            value={`KES ${Number(stats.total_expected_this_month).toLocaleString()}`}
            icon={DollarSign}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50"
          />
          <StatCard
            label="Outstanding"
            value={`KES ${(
              Number(stats.total_expected_this_month) -
              Number(stats.total_collected_this_month)
            ).toLocaleString()}`}
            icon={AlertCircle}
            iconColor="text-rose-500"
            iconBg="bg-rose-50"
          />
          <StatCard
            label="Customers Paid"
            value={stats.num_paid_this_month}
            sub={`of ${stats.total_customers} total`}
            icon={CheckCircle2}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50"
          />
        </div>
      )}
    </div>
  );
}
