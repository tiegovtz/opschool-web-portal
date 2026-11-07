export const updateChapterProgress = async (progress, accessToken) => {
    await $fetch("/api/progress/update-progress",{
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: progress,
    }).then((response) => {
        return response;
    }).catch((error) => {
        console.error('Error while updating progress :', error?.message);
    });
}
