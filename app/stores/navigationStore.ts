import { defineStore } from "pinia";

export const useNavigationStore = defineStore("navigation", {
  state: () => ({
    topicToView: null as { route: string; updatedAt: number } | null,
    videoToView: null as { route: string; updatedAt: number } | null,
    experimentToView: null as { route: string; updatedAt: number } | null,
    audioToListen: null as { route: string; updatedAt: number } | null,
    smartClass: null as { route: string; updatedAt: number } | null,
    liveTV: null as { route: string; updatedAt: number } | null,
    goBack: null as { route: string; updatedAt: number } | null,
  }),

  actions: {
    resetRememberedRoutes() {
      this.topicToView = null;
      this.videoToView = null;
      this.experimentToView = null;
      this.liveTV = null;
      this.smartClass = null;
      this.audioToListen = null;
      this.goBack = null;
    },
    setTopic(route: string) {
      this.topicToView = { route, updatedAt: Date.now() };
    },
    setVideo(route: string) {
      this.videoToView = { route, updatedAt: Date.now() };
    },
    setExperiment(route: string) {
      this.experimentToView = { route, updatedAt: Date.now() };
    },
    setAudio(route: string) {
      this.audioToListen = { route, updatedAt: Date.now() };
    },
    setSmartClass(route: string) {
      this.smartClass = { route, updatedAt: Date.now() };
    },
    setLiveTV(route: string) {
      this.liveTV = { route, updatedAt: Date.now() };
    },
    setGoBack(route: string) {
      this.goBack = { route, updatedAt: Date.now() };
    },
    clearAll() {
      this.resetRememberedRoutes();
    },
    getLatestRoute() {
      const routes = [
        this.topicToView,
        this.videoToView,
        this.experimentToView,
        this.audioToListen,
        this.smartClass,
        this.liveTV,
        this.goBack,
      ]
        .filter(Boolean)
        .sort((a, b) => b!.updatedAt - a!.updatedAt);

      return routes.length ? routes[0]!.route : null;
    },
  },
  persist: true,
});
