import { Coffee } from 'lucide-react';

export default function DonateButton() {
  return (
    <a
      href={process.env.NEXT_PUBLIC_DONATE_URL ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-white font-semibold shadow-lg transition"
    >
      <Coffee size={18} />
      Buy&nbsp;me&nbsp;a&nbsp;coffee
    </a>
  );
} 