'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMessages, markConversationRead, sendMessage } from '@/services/conversations.service'
import type { ChatMessage } from '@/types/message'

const POLL_MS = 4000

const byTime = (a: ChatMessage, b: ChatMessage) =>
  a.createdAt === b.createdAt ? (a.id < b.id ? -1 : 1) : a.createdAt < b.createdAt ? -1 : 1

function merge(current: ChatMessage[], incoming: ChatMessage[]) {
  if (incoming.length === 0) return current
  const known = new Set(current.map((message) => message.id))
  const added = incoming.filter((message) => !known.has(message.id))
  return added.length === 0 ? current : [...current, ...added].sort(byTime)
}

// Loads the newest messages, then asks only for newer ones every few seconds while the tab is visible.
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const messagesRef = useRef<ChatMessage[]>([])
  const markedRef = useRef<string | null>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const markIfNeeded = useCallback(() => {
    if (document.visibilityState !== 'visible') return
    const lastIncoming = [...messagesRef.current].reverse().find((message) => !message.mine)
    if (!lastIncoming || lastIncoming.id === markedRef.current) return
    markedRef.current = lastIncoming.id
    markConversationRead(conversationId)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['summary'] })
        void queryClient.invalidateQueries({ queryKey: ['conversations'] })
      })
      .catch(() => {
        markedRef.current = null
      })
  }, [conversationId, queryClient])

  useEffect(() => {
    let cancelled = false
    fetchMessages(conversationId)
      .then((page) => {
        if (cancelled) return
        setMessages(page.messages)
        setHasMore(page.hasMore)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [conversationId])

  useEffect(() => {
    markIfNeeded()
  }, [messages, markIfNeeded])

  const poll = useCallback(async () => {
    if (document.visibilityState !== 'visible') return
    const last = messagesRef.current.at(-1)
    if (!last) return
    try {
      const page = await fetchMessages(conversationId, { after: last.id })
      setMessages((current) => merge(current, page.messages))
    } catch {
      // keep trying quietly on the next tick
    }
  }, [conversationId])

  useEffect(() => {
    const timer = window.setInterval(() => void poll(), POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void poll()
        markIfNeeded()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [poll, markIfNeeded])

  const send = useCallback(
    async (body: string) => {
      const message = await sendMessage(conversationId, body)
      setMessages((current) => merge(current, [message]))
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
      return message
    },
    [conversationId, queryClient],
  )

  const loadOlder = useCallback(async () => {
    const first = messagesRef.current[0]
    if (!first) return
    setLoadingOlder(true)
    try {
      const page = await fetchMessages(conversationId, { before: first.id })
      setMessages((current) => merge(current, page.messages))
      setHasMore(page.hasMore)
    } finally {
      setLoadingOlder(false)
    }
  }, [conversationId])

  return { messages, status, hasMore, loadingOlder, send, loadOlder }
}