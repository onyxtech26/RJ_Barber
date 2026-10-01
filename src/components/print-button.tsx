'use client';

import { useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import { printPage } from '@/lib/print';

export function PrintButton({
  url,
  label = 'Print',
  ...buttonProps
}: { url: string; label?: string } & Omit<ButtonProps, 'onClick'>) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      variant="outline"
      size="lg"
      className="h-11"
      disabled={isLoading}
      {...buttonProps}
      onClick={async () => {
        setIsLoading(true);
        try {
          await printPage(url);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Printing failed.');
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {isLoading ? <Loader2 className="animate-spin" /> : <Printer />}
      {label}
    </Button>
  );
}
