import { ReceiptText } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { requireStaff } from '@/server/auth/session';

export default async function OrdersPage() {
  await requireStaff();

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <h1 className="text-xl font-bold">Orders</h1>
      <EmptyState
        icon={ReceiptText}
        title="No orders yet"
        description="Paid, pending and voided sales will be listed here with their receipts."
      />
    </div>
  );
}
