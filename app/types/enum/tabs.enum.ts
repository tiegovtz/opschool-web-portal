import type { LanguageSupport } from "../language.interface";

export enum HomeTabs {
  video = "Instructional Videos",
  classVideos = "Class Videos",
  activity = "Learner's Activities",
  audio = "Audios",
  smartClass = "Smart Class",
  subject = "Subjects",
  interactive = "Interactive Content",
}

export type HomeTabLabelKey = keyof typeof HomeTabs;

export const homeTabsByLanguage: Record<
  LanguageSupport,
  Record<HomeTabLabelKey, string>
> = {
  english: {
    video: "Instructional Videos",
    classVideos: "Class Videos",
    activity: "Learner's Activities",
    audio: "Audios",
    smartClass: "Smart Class",
    subject: "Subjects",
    interactive: "Interactive Content",
  },
  kiswahili: {
    video: "Video za Mafunzo",
    classVideos: "Video za Darasani",
    activity: "Shughuli za Mwanafunzi",
    audio: "Sauti",
    smartClass: "Darasa Mahiri",
    subject: "Masomo",
    interactive: "Maudhui Shirikishi",
  },
};
