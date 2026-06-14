import { useAnnouncement } from '../../hooks/useAnnouncement'

// A dismissible banner for product updates / new-feature notices.
// Content comes from the latest active doc in the `announcements` collection.
export default function AnnouncementBanner() {
  const { announcement, dismiss } = useAnnouncement()

  if (!announcement) return null

  return (
    <div
      role="status"
      className="animate-slide-up card border-lavender-200 bg-lavender-50 px-4 py-3 mb-5 flex items-start gap-3"
    >
      <span className="text-xl leading-none mt-0.5" aria-hidden="true">
        🎉
      </span>
      <div className="flex-1 min-w-0">
        {announcement.title && (
          <p className="font-bold text-lavender-600">{announcement.title}</p>
        )}
        {announcement.body && (
          <p className="text-sm text-gray-600 mt-0.5">{announcement.body}</p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="btn-icon shrink-0 -mr-1 -mt-1 text-gray-400 hover:text-gray-600"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}
