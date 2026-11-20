'use client';

import { useEffect } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PrintCertificateButton() {
  // Scope landscape @page rule to the certificate view so other pages retain default portrait printing.
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-certificate-print-page', 'true');
    style.textContent = '@page { size: A4 landscape; margin: 0; }';
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  return (
    <Button type="button" variant="primary" onClick={() => window.print()}>
      <Printer className="w-5 h-5" aria-hidden="true" />
      <span>Cetak / Simpan PDF</span>
    </Button>
  );
}
