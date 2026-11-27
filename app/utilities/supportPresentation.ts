import type { SupportTicket } from '../../shared/support/contracts';
export const supportStatusTone: Record<SupportTicket['status'], string> = {
  new: 'border-deepBlue/20 bg-deepBlue/5 text-deepBlue',
  in_review: 'border-amber-200 bg-amber-50 text-amber-800',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};
