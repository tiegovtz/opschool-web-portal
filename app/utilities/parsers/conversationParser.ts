const conversationParser = (query: string): string => {
  const regex = /conversation="([^"]+)",chapterId="([^"]+)"(?:,type="([^"]+)")?/g;

  return query.replace(regex, (match, identifier, chapterId, type) => {
    const safeIdentifier = String(identifier || '').trim();
    const safeChapterId = String(chapterId || '').trim();
    const safeType = String(type || '').trim();
    const normalizedType = safeType.toLowerCase();
    const isConstant = normalizedType === 'constant';
    const buttonLabel = isConstant ? 'English Practice' : 'Conversation Practice';

    return `<button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-oceanBlue text-white hover:bg-deepBlue transition-colors"
        onclick="openConversationPractice('${safeChapterId}','${safeIdentifier}','${safeType}')"
        data-conversation-identifier="${safeIdentifier}"
        data-conversation-chapter="${safeChapterId}"
        data-conversation-type="${safeType}"
        aria-label="Open ${buttonLabel.toLowerCase()}"
      >
        ${buttonLabel}
      </button>`;
  });
};

declare global {
  interface Window {
    openConversationPractice: (
      chapterId: string,
      identifier: string,
      type?: string
    ) => void;
    closeConversationPractice?: () => void;
  }
}

if (typeof window !== 'undefined') {
  const overlayId = 'conversation-practice-overlay';
  const iframeId = 'conversation-practice-iframe';

  const closeOverlay = () => {
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
  };

  window.closeConversationPractice = closeOverlay;

  window.openConversationPractice = (
    chapterId: string,
    identifier: string,
    type?: string
  ) => {
    const normalizedType = String(type || '').trim().toLowerCase();
    const baseRoute =
      normalizedType === 'constant' ? '/english-practice' : '/conversation-practice';
    const params = new URLSearchParams();
    if (chapterId) params.set('chapterId', chapterId);
    if (identifier) params.set('identifier', identifier);
    // Set type parameter: use provided type, or default to 'engage' if missing (since missing type means engage)
    const typeToUse = normalizedType || 'engage';
    params.set('type', typeToUse);
    params.set('embed', '1');
    const url = `${baseRoute}?${params.toString()}`;

    let overlay = document.getElementById(overlayId) as HTMLDivElement | null;
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);padding:16px;';
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeOverlay();
      });

      const container = document.createElement('div');
      container.style.cssText =
        'position:relative;width:100%;max-width:1100px;max-height:90vh;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.2);';

      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.setAttribute('aria-label', 'Close conversation practice');
      closeButton.textContent = '×';
      closeButton.style.cssText =
        'position:absolute;top:12px;right:12px;width:40px;height:40px;border-radius:9999px;border:none;background:#fff;color:#374151;font-size:24px;cursor:pointer;z-index:2;';
      closeButton.addEventListener('click', closeOverlay);

      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.src = url;
      iframe.title = 'Conversation practice';
      iframe.style.cssText =
        'width:100%;height:90vh;border:none;display:block;background:#fff;';

      container.appendChild(closeButton);
      container.appendChild(iframe);
      overlay.appendChild(container);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      return;
    }

    if (iframe) {
      iframe.src = url;
    }
  };
}

export default conversationParser;
