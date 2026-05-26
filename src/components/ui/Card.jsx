export default function Card({ children, className = '', onClick }) {
  const base = 'card p-4 animate-fade-in'
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${base} w-full text-left hover:shadow-md transition-shadow duration-150 ${className}`}
      >
        {children}
      </button>
    )
  }
  return <div className={`${base} ${className}`}>{children}</div>
}
