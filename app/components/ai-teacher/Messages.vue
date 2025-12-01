<template>
  <div
    class="p-6 space-y-5 h-[calc(100vh-280px)] max-h-[600px] overflow-y-auto bg-gradient-to-b from-gray-50/30 to-white"
  >
    <div
      v-if="messages.length === 0"
      class="flex flex-col items-center justify-center h-full text-center px-4"
    >
      <div
        class="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4"
      >
        <Icon
          name="heroicons:chat-bubble-left"
          class="w-10 h-10 text-oceanBlue"
        />
      </div>
      <h2 class="text-xl font-semibold text-gray-800 mb-2">
        How can I help you today?
      </h2>
      <p class="text-gray-500 text-sm max-w-md">
        Ask me anything about your learning journey, assignments, or any
        questions you have.
      </p>
    </div>

    <div
      v-for="(m, index) in messages"
      :key="m.id ? m.id : index"
    >
      <AiTeacherMessageUser
        v-if="m.role === 'user'"
        :message="m"
      />
      <AiTeacherMessageAI
        v-else
        :message="m"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ messages: any[] }>();
</script>
