'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PrintCertificateButton() {
  return (
    <Button type="button" variant="primary" onClick={() => window.print()}>
      <Printer className="w-5 h-5" aria-hidden="true" />
      <span>Cetak / Simpan PDF</span>
    </Button>
  );
}
