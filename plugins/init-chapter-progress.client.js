// plugins/initChapterProgress.client.js

export default defineNuxtPlugin(() => {
  const chapterProgress = useCookie('chapterProgress', {
    maxAge: 60 * 60 * 24 * 1, // 1 days
    httpOnly: false,
    sameSite: 'strict',
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
