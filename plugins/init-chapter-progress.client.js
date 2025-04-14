// plugins/initChapterProgress.client.js

export default defineNuxtPlugin(() => {
  const chapterProgress = useCookie('chapterProgress', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  if (!chapterProgress.value) {
    chapterProgress.value = {
      userId: '',
      chapterId: '',
      videoProgress: 0,
      notesProgress: 0,
      experimentsAttempted: 0,
      totalExperiments: 0,
      assessmentsAttempted: 0,
      totalAssessments: 0,
    };
  }
});
