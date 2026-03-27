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
    closeEnglishPractice?: () => void;
  }
}

if (typeof window !== 'undefined') {
  const overlayId = 'conversation-practice-overlay';
  const iframeId = 'conversation-practice-iframe';
  const toastId = 'conversation-practice-overlay-toast';
  let overlayRef: HTMLDivElement | null = null;
  let iframeRef: HTMLIFrameElement | null = null;
  let toastRef: HTMLDivElement | null = null;
  let popstateBound = false;
  let messageBound = false;
  let popstateHandler: ((event: PopStateEvent) => void) | null = null;
  let messageHandler: ((event: MessageEvent) => void) | null = null;

  const renderOverlayToast = (message: string, tone: 'info' | 'error' = 'info') => {
    if (!message) return;
    let toast = toastRef || (document.getElementById(toastId) as HTMLDivElement | null);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = toastId;
      toast.style.cssText =
        'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:1201;width:min(92vw,520px);padding:12px 16px;border-radius:10px;background:#fff;color:#111827;border:1px solid #e5e7eb;box-shadow:0 8px 20px rgba(15,23,42,0.12);text-align:center;font-size:0.9rem;pointer-events:none;';
      document.body.appendChild(toast);
    }
    toastRef = toast;
    toast.textContent = message;
    toast.style.borderColor = tone === 'error' ? '#fecaca' : '#e5e7eb';
    toast.style.color = tone === 'error' ? '#991b1b' : '#111827';
  };

  const closeOverlay = ({ fromPopstate = false }: { fromPopstate?: boolean } = {}) => {
    const overlay = overlayRef || (document.getElementById(overlayId) as HTMLDivElement | null);
    if (!overlay) return;
    if (!fromPopstate && window.history.state?.conversationOverlay) {
      // Let popstate do the actual DOM close to avoid double-back.
      window.history.back();
      return;
    }
    overlay.remove();
    overlayRef = null;
    iframeRef = null;
    const toast = toastRef || (document.getElementById(toastId) as HTMLDivElement | null);
    if (toast) {
      toast.remove();
    }
    toastRef = null;
    document.body.style.overflow = '';

    if (popstateBound && popstateHandler) {
      window.removeEventListener('popstate', popstateHandler);
      popstateBound = false;
      popstateHandler = null;
    }
    if (messageBound && messageHandler) {
      window.removeEventListener('message', messageHandler);
      messageBound = false;
      messageHandler = null;
    }
  };
  const handleCloseOverlayClick = (_event: MouseEvent) => {
    closeOverlay();
  };

  window.closeConversationPractice = closeOverlay;
  window.closeEnglishPractice = closeOverlay;

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

    let overlay = overlayRef || (document.getElementById(overlayId) as HTMLDivElement | null);
    let iframe = iframeRef || (document.getElementById(iframeId) as HTMLIFrameElement | null);

    if (!overlay) {
      overlay = document.createElement('div');
      overlayRef = overlay;
      overlay.id = overlayId;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);padding:8px;overflow:hidden;';
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeOverlay();
      });

      const container = document.createElement('div');
      container.style.cssText =
        'position:relative;width:100%;max-width:1100px;height:min(calc(100dvh - 16px), calc(100svh - 16px));max-height:min(calc(100dvh - 16px), calc(100svh - 16px));background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.2);display:flex;flex-direction:column;';

      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.setAttribute('aria-label', 'Close conversation practice');
      closeButton.textContent = '×';
      closeButton.style.cssText =
        'position:absolute;top:12px;right:12px;width:40px;height:40px;border-radius:9999px;border:none;background:#fff;color:#374151;font-size:24px;cursor:pointer;z-index:2;';
      closeButton.addEventListener('click', handleCloseOverlayClick);

      iframe = document.createElement('iframe');
      iframeRef = iframe;
      iframe.id = iframeId;
      iframe.src = url;
      iframe.title = 'Conversation practice';
      iframe.style.cssText =
        'width:100%;height:100%;min-height:0;flex:1 1 auto;border:none;display:block;background:#fff;';

      container.appendChild(closeButton);
      container.appendChild(iframe);
      overlay.appendChild(container);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      if (!window.history.state?.conversationOverlay) {
        window.history.pushState(
          { ...(window.history.state || {}), conversationOverlay: true },
          ''
        );
      }

      if (!popstateBound) {
        popstateHandler = () => {
          if (document.getElementById(overlayId)) {
            closeOverlay({ fromPopstate: true });
          }
        };
        window.addEventListener('popstate', popstateHandler);
        popstateBound = true;
      }

      if (!messageBound) {
        messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          const data = event.data;
          if (!data || typeof data !== 'object') return;
          const typedData = data as { type?: string; message?: string; tone?: 'info' | 'error' };
          if (typedData.type === 'CLOSE_CONVERSATION_OVERLAY') {
            closeOverlay();
            return;
          }
          if (typedData.type === 'CONVERSATION_OVERLAY_TOAST') {
            renderOverlayToast(String(typedData.message || ''), typedData.tone || 'info');
          }
        };
        window.addEventListener('message', messageHandler);
        messageBound = true;
      }
      return;
    }

    if (iframe) {
      iframe.src = url;
    }
  };
}

export default conversationParser;
