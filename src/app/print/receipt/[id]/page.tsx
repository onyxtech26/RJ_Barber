import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BrandLogo } from '@/components/brand-logo';
import { getOrderReceipt } from '@/features/pos/queries';
import { db } from '@/server/db';
import { PAYMENT_METHOD_LABELS } from '@/lib/enums';
import { formatDateTime } from '@/lib/format';
import { formatRM } from '@/lib/money';

export const metadata: Metadata = { title: 'Receipt' };

const STATUS_BANNER = {
  awaiting_payment: 'NOT PAID',
  cancelled: 'CANCELLED',
  voided: 'VOIDED',
  paid: null,
} as const;

/** 80mm thermal receipt (≈72mm printable). Also readable on screen if opened directly. */
export default async function ReceiptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [receipt, shop] = await Promise.all([
    getOrderReceipt(id),
    db.query.shopSettings.findFirst({
      columns: { name: true, address: true, phone: true, receiptFooter: true, sstRegNo: true },
    }),
  ]);
  if (!receipt) notFound();

  const banner = STATUS_BANNER[receipt.status];

  return (
    <>
      <style>{`
        @page { size: 80mm auto; margin: 0; }
        @media print { html, body { background: #fff !important; } }
      `}</style>
      <article
        data-print-ready
        className="mx-auto w-[72mm] px-[2mm] py-[4mm] font-sans text-[11.5px] leading-snug text-black tabular-nums"
      >
        <header className="flex flex-col items-center gap-1 text-center">
          <BrandLogo size={88} className="contrast-125 grayscale" />
          <p className="text-[15px] font-bold">{shop?.name ?? 'RJ Barber Salon'}</p>
          {shop?.address && <p className="whitespace-pre-line">{shop.address}</p>}
          {shop?.phone && <p>Tel: {shop.phone}</p>}
          {receipt.sstSen > 0 && shop?.sstRegNo && <p>SST Reg. No: {shop.sstRegNo}</p>}
        </header>

        {banner && (
          <p className="my-2 border-2 border-black py-1 text-center text-[16px] font-black tracking-widest">{banner}</p>
        )}

        <Divider />
        <dl className="space-y-0.5">
          <Row label="Receipt" value={receipt.receiptNo} />
          <Row label="Date" value={formatDateTime(receipt.confirmedAt ?? receipt.createdAt)} />
          <Row label="Served by" value={receipt.confirmedByName ?? receipt.createdByName} />
          {receipt.customerName && <Row label="Customer" value={receipt.customerName} />}
        </dl>
        <Divider />

        <ul className="space-y-1.5">
          {receipt.lines.map((line, i) => (
            <li key={i}>
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{line.name}</span>
                <span className="shrink-0">{formatRM(line.lineTotalSen).replace('RM ', '')}</span>
              </div>
              <div className="flex justify-between gap-2 text-[10.5px]">
                <span>
                  {line.quantity} × {formatRM(line.unitPriceSen).replace('RM ', '')}
                </span>
                {line.barberName && <span>{line.barberName}</span>}
              </div>
            </li>
          ))}
        </ul>

        <Divider />
        <dl className="space-y-0.5">
          <Row label="Subtotal" value={formatRM(receipt.subtotalSen)} />
          {receipt.discountSen > 0 && (
            <Row label={`Discount${receipt.discountReason ? ` (${receipt.discountReason})` : ''}`} value={`-${formatRM(receipt.discountSen)}`} />
          )}
          {receipt.sstSen > 0 && <Row label={`SST ${receipt.sstRateBps / 100}%`} value={formatRM(receipt.sstSen)} />}
        </dl>
        <div className="mt-1 flex justify-between border-y-2 border-black py-1 text-[16px] font-black">
          <span>TOTAL</span>
          <span>{formatRM(receipt.totalSen)}</span>
        </div>

        <dl className="mt-1 space-y-0.5">
          <Row label="Paid by" value={PAYMENT_METHOD_LABELS[receipt.paymentMethod]} />
          {receipt.cashReceivedSen !== null && (
            <>
              <Row label="Cash received" value={formatRM(receipt.cashReceivedSen)} />
              <Row label="Change" value={formatRM(receipt.changeSen ?? 0)} />
            </>
          )}
          {receipt.paymentRef && <Row label="Reference" value={receipt.paymentRef} />}
        </dl>

        <Divider />
        <footer className="space-y-0.5 text-center">
          {shop?.receiptFooter && <p className="font-semibold whitespace-pre-line">{shop.receiptFooter}</p>}
          <p className="text-[10px]">Haircuts &amp; Shaves · Since 2022</p>
        </footer>
      </article>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt>{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function Divider() {
  return <hr className="my-2 border-t border-dashed border-black" />;
}
