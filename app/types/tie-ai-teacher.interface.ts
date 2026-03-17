export type PendingNavigation =
  | { type: "new-chat" }
  | { type: "session"; sessionId: string };
