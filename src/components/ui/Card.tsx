interface CardProps {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Card({ selected, onClick, children, className = '' }: CardProps) {
  const interactive = !!onClick;

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`rounded-xl border-2 p-5 transition-all
        ${interactive ? 'cursor-pointer hover:shadow-md' : ''}
        ${selected ? 'border-wood-500 bg-wood-50 shadow-md' : 'border-gray-200 bg-white'}
        ${className}`}
    >
      {children}
    </div>
  );
}
