import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const origin = () => new URL(env.FRONTEND_URL).origin
const tokenLink = (path: string, token: string) => `${origin()}${path}?token=${encodeURIComponent(token)}`

type Mail = { to: string; subject: string; text: string; html: string }

// Returns true when the provider accepted the message. Failures are logged, never thrown,
// so a broken email provider cannot break registration or messaging.
async function sendMail(mail: Mail): Promise<boolean> {
  if (!env.EMAIL_API_KEY) {
    if (env.NODE_ENV === 'production') {
      logger.warn({ to: mail.to }, 'EMAIL_API_KEY is not set: email was not sent')
    } else {
      logger.info(`\n[DEV EMAIL] to: ${mail.to}\nsubject: ${mail.subject}\n${mail.text}\n`)
    }
    return false
  }

  try {
    // Resend HTTP API. Check https://resend.com/docs before relying on this in production.
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
    })
    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as { name?: string; message?: string } | null
      logger.error(
        { status: response.status, name: detail?.name, reason: detail?.message?.slice(0, 200) },
        'Email provider rejected the message',
      )
      return false
    }
    return true
  } catch (err) {
    logger.error({ err }, 'Email provider unreachable')
    return false
  }
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = tokenLink('/auth/verify-email', token)
  await sendMail({
    to,
    subject: 'Verify your UniKamp email',
    text: `Hi ${name},\n\nConfirm your email address:\n${url}\n\nThis link expires in 24 hours. If you did not create a UniKamp account, ignore this email.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p><a href="${url}">Confirm your email address</a></p><p>This link expires in 24 hours. If you did not create a UniKamp account, ignore this email.</p>`,
  })
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = tokenLink('/auth/reset-password', token)
  await sendMail({
    to,
    subject: 'Reset your UniKamp password',
    text: `Hi ${name},\n\nReset your password:\n${url}\n\nThis link expires in 1 hour. If you did not ask for this, ignore this email and your password stays the same.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p><a href="${url}">Reset your password</a></p><p>This link expires in 1 hour. If you did not ask for this, ignore this email and your password stays the same.</p>`,
  })
}

// Deliberately does not include the message text
export async function sendNewMessageEmail(
  to: string,
  name: string,
  fromName: string,
  productTitle: string,
  conversationId: string,
) {
  const url = `${origin()}/messages/${encodeURIComponent(conversationId)}`
  const title = productTitle.slice(0, 80)
  await sendMail({
    to,
    subject: 'You have a new message on UniKamp',
    text: `Hi ${name},\n\n${fromName} sent you a message about "${title}".\nOpen UniKamp to read and reply:\n${url}\n\nStay safe: meet in a public place on campus and never pay in advance.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(fromName)} sent you a message about &quot;${escapeHtml(title)}&quot;.</p><p><a href="${url}">Open UniKamp to read and reply</a></p><p>Stay safe: meet in a public place on campus and never pay in advance.</p>`,
  })
}

// Used by the pre-launch check (pnpm check:email). Returns true if the provider accepted it.
export function sendTestEmail(to: string) {
  return sendMail({
    to,
    subject: 'UniKamp email test',
    text: 'If you can read this, UniKamp can send email. You can delete this message.',
    html: '<p>If you can read this, UniKamp can send email. You can delete this message.</p>',
  })
}