export default function EmptyState({ icon = '🍼', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <span className="text-5xl mb-4 animate-pulse-soft">{icon}</span>
      <h3 className="text-lg font-bold text-gray-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-400 mb-6 max-w-xs">{message}</p>}
      {action}
    </div>
  )
}
