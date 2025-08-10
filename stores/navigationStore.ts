import { defineStore } from "pinia";

export const useNavigationStore = defineStore("navigation", {
  state: () => ({
    topicToView: null as { route: string; updatedAt: number } | null,
    videoToView: null as { route: string; updatedAt: number } | null,
    experimentToView: null as { route: string; updatedAt: number } | null,
    audioToListen: null as { route: string; updatedAt: number } | null,
    smartClass: null as { route: string; updatedAt: number } | null,
    liveTV: null as { route: string; updatedAt: number } | null,
  }),

  actions: {
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
    clearAll() {
      this.topicToView = null;
      this.videoToView = null;
      this.experimentToView = null;
      this.liveTV = null;
      this.smartClass = null;
    },
    getLatestRoute() {
      const routes = [
        this.topicToView,
        this.videoToView,
        this.experimentToView,
        this.audioToListen,
        this.smartClass,
        this.liveTV,
      ]
        .filter(Boolean)
        .sort((a, b) => b!.updatedAt - a!.updatedAt);

      return routes.length ? routes[0]!.route : null;
    },
  },
});
