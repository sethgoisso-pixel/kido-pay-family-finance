type KProps = { className?: string };

/**
 * Le monogramme K de KIDO PAY : une barre verticale et deux bras qui se
 * rejoignent sur le stem, le bras du bas en menthe (token `--brand-spark`).
 */
export function BrandK({ className }: KProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M9.5 5.5v21" stroke="currentColor" strokeWidth="4.2" />
      <path d="M22.6 6.4 11.2 16.4" stroke="currentColor" strokeWidth="4.2" />
      <path d="M11.2 16.4 22.6 26.6" stroke="var(--brand-spark)" strokeWidth="4.2" />
    </svg>
  );
}

/** Le logo d'en-tête : tuile en dégradé indigo + monogramme K + reflet qui balaie. */
export function BrandMark() {
  return (
    <span className="brand-icon" aria-hidden="true">
      <BrandK className="brand-k" />
      <span className="brand-sheen" />
    </span>
  );
}
