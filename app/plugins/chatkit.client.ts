export default defineNuxtPlugin(() => {
  if (process.client) {
    // Check if script is already loaded
    if (document.querySelector('script[src*="chatkit.js"]')) {
      if (window.customElements?.get('openai-chatkit')) {
        window.dispatchEvent(new CustomEvent('chatkit-script-loaded'));
      }
      return;
    }

    // Load ChatKit script
    const script = document.createElement('script');
    script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      window.dispatchEvent(new CustomEvent('chatkit-script-loaded'));
    };
    
    script.onerror = () => {
      window.dispatchEvent(new CustomEvent('chatkit-script-error', {
        detail: 'Failed to load ChatKit script'
      }));
    };
    
    document.head.appendChild(script);
  }
});

