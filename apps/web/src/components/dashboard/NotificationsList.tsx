'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { FormAlert } from '@/components/forms/FormFeedback'
import { formatMessageTime } from '@/lib/format-time'
import { cn } from '@/lib/utils'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications.service'

export function NotificationsList() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['notifications'], queryFn: listNotifications })
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    void queryClient.invalidateQueries({ queryKey: ['summary'] })
  }
  const readOne = useMutation({ mutationFn: markNotificationRead, onSuccess: refresh })
  const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refresh })

  if (query.isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
  if (query.isError || !query.data) return <FormAlert message="Could not load your notifications." />
  const { notifications, unreadCount } = query.data

  if (notifications.length === 0) return <p className="text-sm text-slate-600">No notifications yet.</p>

  return (
    <div className="space-y-3">
      {unreadCount > 0 ? (
        <button type="button" onClick={() => readAll.mutate()} disabled={readAll.isPending} className="text-sm text-brand-purple hover:underline">
          Mark all as read
        </button>
      ) : null}
      <ul className="space-y-2">
        {notifications.map((item) => {
          const content = (
            <>
              <p className={cn('text-sm', item.read ? 'text-slate-600' : 'font-semibold text-slate-900')}>{item.body}</p>
              <p className="text-xs text-slate-500">{formatMessageTime(item.createdAt)}</p>
            </>
          )
          return (
            <li key={item.id} className={cn('rounded-2xl border p-3', item.read ? 'border-slate-200 bg-white' : 'border-brand-purple/40 bg-brand-purple/5')}>
              {item.link ? (
                <Link href={item.link} onClick={() => !item.read && readOne.mutate(item.id)} className="block">
                  {content}
                </Link>
              ) : (
                <button type="button" onClick={() => !item.read && readOne.mutate(item.id)} className="block w-full text-left">
                  {content}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}