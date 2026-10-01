import Image from 'next/image';
import { cn } from '@/lib/utils';
import logo from '../../public/barber_logo.jpeg';

export function BrandLogo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src={logo}
      alt="RJ Barber Salon"
      width={size}
      height={size}
      priority
      className={cn('rounded-full', className)}
    />
  );
}
