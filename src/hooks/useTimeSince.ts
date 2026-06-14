import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { toJsDate } from '../utils/formatters'
import type { TimestampLike } from '../types'

export function useTimeSince(timestamp: TimestampLike | null | undefined): string {
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!timestamp) {
      setLabel('')
      return
    }

    function update() {
      const date = toJsDate(timestamp!)
      const diff = Date.now() - date.getTime()
      if (diff < 60000) {
        setLabel('Just now')
      } else {
        setLabel(formatDistanceToNow(date, { addSuffix: true }))
      }
    }

    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [timestamp])

  return label
}
