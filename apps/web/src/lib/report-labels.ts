export const REPORT_REASON_LABEL: Record<string, string> = {
  SCAM: 'Scam or fraud',
  PROHIBITED_ITEM: 'Prohibited item',
  MISLEADING: 'Misleading description or photos',
  HARASSMENT: 'Harassment or abuse',
  SPAM: 'Spam',
  OTHER: 'Something else',
}

export const REPORT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Waiting for review',
  REVIEWING: 'Being reviewed',
  RESOLVED: 'Reviewed, action taken',
  DISMISSED: 'Reviewed, no violation found',
}