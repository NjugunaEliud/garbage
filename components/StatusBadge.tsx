interface BadgeProps {
  status: 'paid' | 'unpaid' | 'partial';
}

const styles: Record<BadgeProps['status'], string> = {
  paid:    'bg-green-100 text-green-800',
  unpaid:  'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-800',
};

const labels: Record<BadgeProps['status'], string> = {
  paid:    '✅ Paid',
  unpaid:  '❌ Unpaid',
  partial: '⚠️ Partial',
};

export default function StatusBadge({ status }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
