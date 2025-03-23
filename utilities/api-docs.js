const baseURL = "https://apitie.ekima.africa/v1"; // Define baseURL first

// const baseURL = "http://192.168.0.24:5005/v1" // Define baseURL first

const apiDocs = {
    baseURL: baseURL, // You can include it here for reference

    // AUTH API
    auth: {
        // POST
        signUp: `${baseURL}/auth/sign-up`,
        login: `${baseURL}/auth/login`,
        chooseIdentity: `${baseURL}/auth/choose-identity`,
        refreshToken: `${baseURL}/auth/refresh-token`,
        invalidateToken: `${baseURL}/auth/invalidate-token`,
        requestCode: `${baseURL}/auth/request-code`,
        verifyCode: `${baseURL}/auth/verify-code`,
        forgotPassword: `${baseURL}/auth/forgot-password`,
        resetPassword: `${baseURL}/auth/reset-password`,
        changePassword: `${baseURL}/auth/change-password`,
        userExists: `${baseURL}/auth/user-exists`,

        // GET
        profile: `${baseURL}/auth/profile`,

        // PATCH or PUT
        profileEdit: `${baseURL}/auth/profile/edit`,
    },

    // CHAPTERS API
    chapters: {
        getChapters: `${baseURL}/chapters`,
        getChapterId: `${baseURL}/chapters/:id`,
        getByTopicId: `${baseURL}/chapters/load-by-topic/{topicId}`,
        getTopicChapterQNs: `${baseURL}/questions/topic-chapter`,
    },
    
    // EXPERIMENTS API
    experiments: {
        getExperimentId: `${baseURL}/experiments/:id`,
    },

    // LEVELS API
    levels: {
        getLevels: `${baseURL}/levels`,
        getLevelId: `${baseURL}/levels/:id`,
    },

    // SUBJECTS API
    subjects: {
        getSubjects: `${baseURL}/subjects`,
        getSubjectId: `${baseURL}/subjects/:id`,
    },

    // TOPICS API
    topics: {
        getTopics: `${baseURL}/topics`,
        getTopicId: `${baseURL}/topics/:id`,
        getQuestionId: `${baseURL}/topics/{id}/questions`,
        getSubjectId: `${baseURL}/topics/by-subject/{subjectId}`,
        filterTopics: `${baseURL}/public-topics`
    },

    // VIDEO API 
    videos: {
        getStream: `${baseURL}/video-stream/`,
    },

}

export default apiDocs;
