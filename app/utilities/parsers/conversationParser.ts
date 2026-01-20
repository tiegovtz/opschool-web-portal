const conversationParser = (query: string): string => {
  const regex = /conversation="([^"]+)",chapterId="([^"]+)"/g;

  return query.replace(regex, (match, identifier, chapterId) => {
    const safeIdentifier = String(identifier || '').trim();
    const safeChapterId = String(chapterId || '').trim();

    return `<button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-oceanBlue text-white hover:bg-deepBlue transition-colors"
        onclick="openConversationPractice('${safeChapterId}','${safeIdentifier}')"
        data-conversation-identifier="${safeIdentifier}"
        data-conversation-chapter="${safeChapterId}"
        aria-label="Open conversation practice"
      >
        Conversation Practice
      </button>`;
  });
};

declare global {
  interface Window {
    openConversationPractice: (chapterId: string, identifier: string) => void;
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

  window.openConversationPractice = (chapterId: string, identifier: string) => {
    const url = `/conversation-practice?chapterId=${encodeURIComponent(
      chapterId
    )}&identifier=${encodeURIComponent(identifier)}&embed=1`;

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
