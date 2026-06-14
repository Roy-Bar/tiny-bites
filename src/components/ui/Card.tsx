import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
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
