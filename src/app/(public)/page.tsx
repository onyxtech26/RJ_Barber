import { redirect } from 'next/navigation';

export default function RootPage() {
  // Directly redirect to the Point of Sale (POS) system as requested.
  // The system is fully focused on POS & booking management without a marketing landing page.
  redirect('/pos');
}
