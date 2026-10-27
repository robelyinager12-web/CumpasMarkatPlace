import { env } from '../src/config/env.js'
import { sendTestEmail } from '../src/services/email.service.js'

const to = process.argv[2]?.trim()
if (!to) {
  console.error('Usage: pnpm --filter @unikamp/api check:email you@example.com')
  process.exit(1)
}
if (!env.EMAIL_API_KEY) {
  console.error('EMAIL_API_KEY is not set, so nothing can be sent.')
  process.exit(1)
}

console.log(`Sending a test email from "${env.EMAIL_FROM}" to ${to} ...`)
const accepted = await sendTestEmail(to)
if (accepted) {
  console.log('The email provider accepted the message. Now check the inbox (and the spam folder).')
} else {
  console.error('The email provider refused the message. The log line above says why (for example, the domain is not verified yet).')
  process.exit(1)
}