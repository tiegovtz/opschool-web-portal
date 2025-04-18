export const updateChapterProgress = async () => {
    await $fetch("/api/progress/update-progress",{
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
    }).then((response) => {
        return response;
    }).catch((error) => {
        console.error('Error while updating progress :', error?.message);
    });
}
