// Server-only local test storage. Keep the portal copy in sync; both apps share INBOX_DEMO_FILE.
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { dirname, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
export interface DemoActor { id: string; name: string; role: string; email?: string; educationLevel?: 'primary' | 'secondary' }
export interface DemoEntry {
  id: string; userId: string; sender: DemoActor; category: 'feedback' | 'technical' | 'feature' | 'support';
  educationLevel: 'primary' | 'secondary'; language: 'en' | 'sw'; subject: string; body: string;
  status: 'new' | 'reviewed' | 'in_review' | 'resolved'; internalNote: string; createdAt: string;
  answers: { question: string; answer: string }[];
  messages: { id: string; sender: 'user' | 'admin'; body: string; createdAt: string }[];
}
export function localInboxEnabled() { return process.env.NODE_ENV !== 'production' && process.env.INBOX_DEMO_ENABLED === 'true'; }
function filePath() {
  const path = process.env.INBOX_DEMO_FILE;
  if (!localInboxEnabled() || !path || !isAbsolute(path)) throw new Error('Local test inbox is not configured.');
  return path;
}
export async function readInbox(): Promise<DemoEntry[]> {
  try { const data = JSON.parse(await readFile(filePath(), 'utf8')); if (data.version !== 1 || !Array.isArray(data.items)) throw new Error('Invalid local inbox file.'); return data.items; }
  catch (error: any) { if (error.code === 'ENOENT') return []; throw error; }
}
async function changeInbox<T>(operation: (items: DemoEntry[]) => T): Promise<T> {
  const path = filePath(); await mkdir(dirname(path), { recursive: true });
  const lock = `${path}.lock`; const expires = Date.now() + 5000;
  while (true) {
    try { await mkdir(lock); break; } catch (error: any) { if (error.code !== 'EEXIST' || Date.now() > expires) throw new Error('The local inbox is busy. Please retry.'); await new Promise(resolve => setTimeout(resolve, 40)); }
  }
  const temporary = `${path}.${randomUUID()}.tmp`;
  try { const items = await readInbox(); const result = operation(items); await writeFile(temporary, JSON.stringify({ version: 1, items }, null, 2), { mode: 0o600 }); await rename(temporary, path); return result; }
  finally { await rm(temporary, { force: true }); await rm(lock, { recursive: true, force: true }); }
}
export async function createEntry(actor: DemoActor, input: Pick<DemoEntry, 'category' | 'educationLevel' | 'language' | 'subject' | 'body'> & { answers?: DemoEntry['answers'] }) {
  return changeInbox(items => {
    const entry: DemoEntry = { ...input, educationLevel: actor.educationLevel || input.educationLevel, id: `demo-${randomUUID()}`, userId: actor.id, sender: actor, createdAt: new Date().toISOString(), status: 'new', internalNote: '', answers: input.answers || [], messages: [] };
    items.unshift(entry); return entry;
  });
}
export async function updateEntry(id: string, actor: DemoActor | 'admin', update: { message?: string; status?: DemoEntry['status']; internalNote?: string }) {
  return changeInbox(items => {
    const entry = items.find(item => item.id === id && (actor === 'admin' || item.userId === actor.id || item.userId === 'demo-sample'));
    if (!entry) throw new Error('Request not found.');
    if (update.message) entry.messages.push({ id: randomUUID(), sender: actor === 'admin' ? 'admin' : 'user', body: update.message, createdAt: new Date().toISOString() });
    if (actor === 'admin') {
      if (update.status) {
        const allowed = entry.category === 'feedback' ? ['new', 'reviewed'] : ['new', 'in_review', 'resolved'];
        if (!allowed.includes(update.status)) throw new Error('Invalid status.'); entry.status = update.status;
      }
      if (update.internalNote !== undefined) entry.internalNote = update.internalNote;
    }
    return entry;
  });
}
export function listTickets(items: DemoEntry[], filters: { userId?: string; educationLevel?: string; category?: string; status?: string; search?: string; page?: number; limit?: number }) {
  const scope = items.filter(item => item.category !== 'feedback' && (!filters.userId || item.userId === filters.userId || item.userId === 'demo-sample') && (!filters.educationLevel || item.educationLevel === filters.educationLevel));
  const counts = Object.fromEntries(['technical', 'feature', 'support'].map(category => [category, { total: scope.filter(item => item.category === category).length, new: scope.filter(item => item.category === category && item.status === 'new').length }]));
  const matches = scope.filter(item => (!filters.category || item.category === filters.category) && (!filters.status || item.status === filters.status) && (!filters.search || `${item.subject} ${item.body} ${item.sender.name}`.toLowerCase().includes(filters.search.toLowerCase())));
  const limit = Math.max(1, Math.min(filters.limit || 10, 50)); const page = Math.max(1, filters.page || 1);
  return { items: matches.slice((page - 1) * limit, page * limit), total: matches.length, counts };
}
export async function authenticateDemoUser(token: string, base: string): Promise<DemoActor | null> {
  const response = await fetch(`${base.replace(/\/+$/, '')}/auth/profile`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!response.ok) return null;
  const payload = await response.json(); const user = payload.data?.user ?? payload.data ?? payload.user ?? payload;
  const id = user._id || user.id || user.userId; if (!id) return null;
  const raw = user.educationLevel?.name || user.educationLevel || user.level?.name || user.level || '';
  const level = String(raw).toLowerCase();
  const educationLevel = /primary|msingi|awali|standard|darasa/.test(level) ? 'primary' : /secondary|sekondari|\bform\b/.test(level) ? 'secondary' : undefined;
  return { id: String(id), name: String(user.name || user.username || 'User'), role: String(user.type || user.roles?.[0] || 'User'), email: typeof user.email === 'string' ? user.email : undefined, educationLevel };
}
