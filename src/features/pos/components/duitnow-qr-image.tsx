'use client';

import { useEffect, useState } from 'react';
import { Loader2, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadDuitnowQr } from '../qr-actions';

/**
 * Shows the shop's DuitNow QR. `version` forces a reload after the owner uploads a new one.
 * Renders a placeholder when there's no QR yet.
 */
export function DuitnowQrImage({
  version = 0,
  className,
  emptyText,
}: {
  version?: number;
  className?: string;
  emptyText: string;
}) {
  const [state, setState] = useState<{ version: number; src: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDuitnowQr()
      .then((src) => !cancelled && setState({ version, src }))
      .catch(() => !cancelled && setState({ version, src: null }));
    return () => {
      cancelled = true;
    };
  }, [version]);

  const box = cn('flex flex-col items-center justify-center rounded-xl', className);

  if (state === null || state.version !== version) {
    return (
      <div className={cn(box, 'border bg-muted')} aria-label="Loading QR code">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!state.src) {
    return (
      <div className={cn(box, 'gap-2 border-2 border-dashed p-4 text-center text-sm text-muted-foreground')}>
        <QrCode className="size-8" />
        {emptyText}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- a data URL from the database, nothing to optimise
  return <img src={state.src} alt="Shop DuitNow QR code" className={cn(box, 'border bg-white object-contain p-2')} />;
}
