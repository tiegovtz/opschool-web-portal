export const updateChapterProgress = async () => {
    await $fetch("/api/progress/update-progress").catch((error) => {
        console.error('Error while updating progress :', error?.message);
    });
}
