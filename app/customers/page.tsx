import { Suspense } from 'react';
import CustomersPage from './CustomersPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading…</div>}>
      <CustomersPage />
    </Suspense>
  );
}
