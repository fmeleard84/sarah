/**
 * Pictogramme Morning Cards : carte noire inclinée sur carte claire.
 * Animé pendant la génération d'une réponse (spécification du 18 mai) :
 * carte claire translateY -5px à -6°, carte noire de 8° à 10,5°, cycle 1,8 s.
 */
export function Picto({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  const anim = (name: string) => (animated ? { animation: `${name} 1.8s ease-in-out infinite` } : undefined);
  return (
    <svg width={size * 0.78} height={size} viewBox="0 0 120 155" aria-hidden="true" className="overflow-visible">
      <g style={{ transformOrigin: "60px 78px", transform: "rotate(-6deg)", ...anim("picto-white") }}>
        <rect x="8" y="6" width="96" height="140" rx="4" fill="var(--color-canvas)" stroke="var(--color-ink)" strokeWidth="3" />
      </g>
      <g style={{ transformOrigin: "60px 78px", transform: "rotate(8deg)", ...anim("picto-black") }}>
        <rect x="16" y="8" width="96" height="140" rx="4" fill="var(--color-ink)" />
      </g>
    </svg>
  );
}
