export const updateChapterProgress = async (progress) => {
    await $fetch("/api/progress/update-progress",{
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: progress,
    }).then((response) => {
        return response;
    }).catch((error) => {
        console.error('Error while updating progress :', error?.message);
    });
}
