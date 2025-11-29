import { computed } from 'vue';

export const useChatKit = () => {
  const config = useRuntimeConfig();
  const workflowId = config.public.CHATKIT_WORKFLOW_ID || '';

  const isWorkflowConfigured = computed(() => {
    return Boolean(workflowId && !workflowId.startsWith('wf_replace'));
  });

  const getClientSecret = async (currentSecret: string | null): Promise<string> => {
    if (!isWorkflowConfigured.value) {
      throw new Error('Set NUXT_PUBLIC_CHATKIT_WORKFLOW_ID in your environment variables.');
    }

    try {
      const response = await fetch('/api/chatkit/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow: { id: workflowId },
          chatkit_configuration: {
            file_upload: {
              enabled: true,
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || response.statusText;
        throw new Error(errorMessage);
      }

      const clientSecret = data?.client_secret;
      if (!clientSecret) {
        throw new Error('Missing client secret in response');
      }

      return clientSecret;
    } catch (error) {
      console.error('Failed to create ChatKit session', error);
      throw error instanceof Error ? error : new Error('Unable to start ChatKit session.');
    }
  };

  return {
    getClientSecret,
    isWorkflowConfigured,
    workflowId,
  };
};

