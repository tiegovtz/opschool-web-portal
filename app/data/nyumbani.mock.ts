import type { Audios } from "~/types/audio.interface";
import type { Experiment } from "~/types/experiment.interface";
import type { GroupedData } from "~/types/grouped.data";
import type { Language } from "~/types/language.interface";
import type { Subjects } from "~/types/subject.interface";
import type { Topic } from "~/types/topic.interface";
import type { Videos } from "~/types/video.interface";

const image = () =>
  Math.random() < 0.5 ? "/images/primary-01.png" : "/images/primary-02.png";

const kiswahiliLanguage: Language = {
  _id: "language-kiswahili",
  name: "Kiswahili",
  code: "sw",
};

export const nyumbaniSubjects: Subjects[] = [
  {
    _id: "subject-hisabati",
    name: "Hisabati",
    description:
      "Maudhui ya kuhesabu, vipimo, mifumo na ufumbuzi wa changamoto za kila siku.",
    thumbnail: image(),
    alt: "Kadi ya somo la Hisabati",
    level: "Msingi",
    views: 1840,
    viewedBy: [],
  },
  {
    _id: "subject-sayansi",
    name: "Sayansi",
    description:
      "Masomo yanayochunguza mazingira, majaribio rahisi na matumizi ya sayansi katika maisha.",
    thumbnail: image(),
    alt: "Kadi ya somo la Sayansi",
    level: "Msingi",
    views: 1622,
    viewedBy: [],
  },
  {
    _id: "subject-kiswahili",
    name: "Kiswahili",
    description:
      "Soma sarufi, kusoma kwa ufahamu, utungaji na matumizi sahihi ya lugha ya Kiswahili.",
    thumbnail: image(),
    alt: "Kadi ya somo la Kiswahili",
    level: "Msingi",
    views: 2140,
    viewedBy: [],
  },
  {
    _id: "subject-jiografia",
    name: "Jiografia",
    description:
      "Jifunze kuhusu ramani, hali ya hewa, mazingira ya Tanzania na dunia kwa ujumla.",
    thumbnail: image(),
    alt: "Kadi ya somo la Jiografia",
    level: "Msingi",
    views: 1190,
    viewedBy: [],
  },
  {
    _id: "subject-uraia",
    name: "Maarifa ya Jamii",
    description:
      "Mada za maadili, uraia, historia ya jamii na wajibu wa mwanafunzi kwa taifa.",
    thumbnail: image(),
    alt: "Kadi ya somo la Maarifa ya Jamii",
    level: "Msingi",
    views: 970,
    viewedBy: [],
  },
  {
    _id: "subject-english",
    name: "English",
    description:
      "Build confidence in listening, vocabulary, sentence structure and classroom communication.",
    thumbnail: image(),
    alt: "Kadi ya somo la English",
    level: "Msingi",
    views: 1348,
    viewedBy: [],
  },
];

const fallbackSubject = nyumbaniSubjects[0]!;

const getSubjectByName = (name: string) =>
  nyumbaniSubjects.find((subject) => subject.name === name) ?? fallbackSubject;

export const nyumbaniTopics: Topic[] = [
  {
    _id: "topic-hisabati-1",
    uid: "topic-hisabati-1",
    name: "Kuzidisha kwa kutumia michoro",
    descriptions:
      "Njia rahisi ya kuelewa kuzidisha kwa kutumia vikundi na picha.",
    thumbnail: image(),
    alt: "Mada ya kuzidisha kwa michoro",
    number: 0,
    featured: true,
    status: "published",
    level: "Darasa la 3",
    subject: "Hisabati",
    views: 1280,
    viewedBy: ["a", "b", "c"],
    isViewed: true,
    avgProgress: 78,
  },
  {
    _id: "topic-hisabati-2",
    uid: "topic-hisabati-2",
    name: "Vipimo vya urefu",
    descriptions:
      "Tambua mita, sentimita na jinsi ya kupima vitu vinavyotuzunguka.",
    thumbnail: image(),
    alt: "Mada ya vipimo vya urefu",
    number: 0,
    featured: true,
    status: "published",
    level: "Darasa la 4",
    subject: "Hisabati",
    views: 940,
    viewedBy: ["a", "b"],
    isViewed: false,
    avgProgress: 42,
  },
  {
    _id: "topic-sayansi-1",
    uid: "topic-sayansi-1",
    name: "Vyanzo vya nishati nyumbani",
    descriptions:
      "Jifunze aina za nishati na matumizi yake katika maisha ya kila siku.",
    thumbnail: image(),
    alt: "Mada ya vyanzo vya nishati",
    number: 0,
    featured: true,
    status: "published",
    level: "Darasa la 4",
    subject: "Sayansi",
    views: 1110,
    viewedBy: ["a", "b", "c", "d"],
    isViewed: true,
    avgProgress: 83,
  },
  {
    _id: "topic-sayansi-2",
    uid: "topic-sayansi-2",
    name: "Mzunguko wa maji",
    descriptions:
      "Elewa mvuke, mawingu, mvua na safari ya maji angani na ardhini.",
    thumbnail: image(),
    alt: "Mada ya mzunguko wa maji",
    number: 0,
    featured: true,
    status: "published",
    level: "Darasa la 5",
    subject: "Sayansi",
    views: 870,
    viewedBy: ["a"],
    isViewed: false,
    avgProgress: 36,
  },
  {
    _id: "topic-kiswahili-1",
    uid: "topic-kiswahili-1",
    name: "Kusoma kwa ufahamu",
    descriptions:
      "Mbinu za kusoma, kutambua hoja kuu na kujibu maswali ya ufahamu.",
    thumbnail: image(),
    alt: "Mada ya kusoma kwa ufahamu",
    number: 0,
    featured: true,
    status: "published",
    level: "Darasa la 4",
    subject: "Kiswahili",
    views: 1420,
    viewedBy: ["a", "b", "c", "d", "e"],
    isViewed: true,
    avgProgress: 88,
  },
  {
    _id: "topic-kiswahili-2",
    uid: "topic-kiswahili-2",
    name: "Uandishi wa sentensi",
    descriptions:
      "Tengeneza sentensi sahihi kwa kuzingatia mpangilio wa maneno na alama.",
    thumbnail: image(),
    alt: "Mada ya uandishi wa sentensi",
    number: 0,
    featured: true,
    status: "published",
    level: "Darasa la 3",
    subject: "Kiswahili",
    views: 760,
    viewedBy: ["a", "b"],
    isViewed: false,
    avgProgress: 49,
  },
  {
    _id: "topic-jiografia-1",
    uid: "topic-jiografia-1",
    name: "Alama za ramani",
    descriptions: "Tambua alama za msingi kwenye ramani na matumizi yake.",
    thumbnail: image(),
    alt: "Mada ya alama za ramani",
    number: 0,
    featured: true,
    status: "published",
    level: "Darasa la 4",
    subject: "Jiografia",
    views: 620,
    viewedBy: ["a"],
    isViewed: false,
    avgProgress: 31,
  },
  {
    _id: "topic-uraia-1",
    uid: "topic-uraia-1",
    name: "Wajibu wa mwanafunzi",
    descriptions:
      "Elewa wajibu wa mwanafunzi nyumbani, shuleni na kwenye jamii.",
    thumbnail: image(),
    alt: "Mada ya wajibu wa mwanafunzi",
    number: 0,
    featured: true,
    status: "published",
    level: "Darasa la 5",
    subject: "Maarifa ya Jamii",
    views: 590,
    viewedBy: ["a", "b"],
    isViewed: true,
    avgProgress: 65,
  },
  {
    _id: "topic-english-1",
    uid: "topic-english-1",
    name: "Introducing yourself",
    descriptions:
      "Practice simple English sentences for greetings and self introduction.",
    thumbnail: image(),
    alt: "Topic card for introducing yourself",
    number: 0,
    featured: true,
    status: "published",
    level: "Darasa la 3",
    subject: "English",
    views: 830,
    viewedBy: ["a", "b", "c"],
    isViewed: false,
    avgProgress: 54,
  },
];

export const nyumbaniExperiments: Experiment[] = [
  {
    _id: "experiment-sayansi-1",
    name: "Kutengeneza kipima upepo rahisi",
    description:
      "Jaribio la kutengeneza kifaa rahisi cha kupima upepo kwa vifaa vya nyumbani.",
    thumbnail: image(),
    alt: "Jaribio la kipima upepo",
    category: "Hands-on",
    subject: "Sayansi",
    level: "Darasa la 5",
    syllabus: "Mazingira",
    stepsFile: "kipima-upepo.pdf",
    stepsFileUrl: "#",
  },
  {
    _id: "experiment-hisabati-1",
    name: "Tafuta eneo la meza",
    description:
      "Tumia vipimo halisi vya darasani kuelewa dhana ya eneo la mstatili.",
    thumbnail: image(),
    alt: "Jaribio la eneo la meza",
    category: "Activity",
    subject: "Hisabati",
    level: "Darasa la 4",
    syllabus: "Vipimo",
    stepsFile: "eneo-la-meza.pdf",
    stepsFileUrl: "#",
  },
  {
    _id: "experiment-jiografia-1",
    name: "Kielelezo cha tabaka za udongo",
    description:
      "Tengeneza kielelezo kinachoonyesha tabaka mbalimbali za udongo kwenye chupa.",
    thumbnail: image(),
    alt: "Jaribio la tabaka za udongo",
    category: "Observation",
    subject: "Jiografia",
    level: "Darasa la 5",
    syllabus: "Udongo",
    stepsFile: "tabaka-za-udongo.pdf",
    stepsFileUrl: "#",
  },
];

export const nyumbaniVideos: Videos[] = [
  {
    _id: "video-hisabati-1",
    name: "Njia za haraka za kugawanya",
    description: "Video ya kufundisha mbinu za kugawanya namba kwa hatua fupi.",
    thumbnail: image(),
    alt: "Video ya kugawanya namba",
    subject: "Hisabati",
    level: "Darasa la 4",
    videoType: "conceptual",
    videoFileUrl: "#",
  },
  {
    _id: "video-sayansi-1",
    name: "Mimea hutengeneza chakula vipi",
    description: "Ufafanuzi wa mchakato wa usanisinuru kwa lugha rahisi.",
    thumbnail: image(),
    alt: "Video ya usanisinuru",
    subject: "Sayansi",
    level: "Darasa la 5",
    videoType: "conceptual",
    videoFileUrl: "#",
  },
  {
    _id: "video-kiswahili-1",
    name: "Matumizi ya alama za uandishi",
    description:
      "Elewa nukta, koma na alama nyingine za msingi katika uandishi.",
    thumbnail: image(),
    alt: "Video ya alama za uandishi",
    subject: "Kiswahili",
    level: "Darasa la 3",
    videoType: "conceptual",
    videoFileUrl: "#",
  },
  {
    _id: "video-sayansi-2",
    name: "Darasa la moja kwa moja: mfumo wa mmengenyo",
    description: "Class video inayopitia hatua kuu za mmengenyo wa chakula.",
    thumbnail: image(),
    alt: "Class video ya mfumo wa mmengenyo",
    subject: "Sayansi",
    level: "Darasa la 5",
    videoType: "class-video",
    videoFileUrl: "#",
  },
  {
    _id: "video-english-1",
    name: "Classroom conversation practice",
    description:
      "Class video ya mazungumzo mafupi ya kutumia darasani kila siku.",
    thumbnail: image(),
    alt: "Class video ya mazungumzo ya darasani",
    subject: "English",
    level: "Darasa la 3",
    videoType: "class-video",
    videoFileUrl: "#",
  },
];

export const nyumbaniAudios: Audios[] = [
  {
    _id: "audio-kiswahili-1",
    name: "Hadithi fupi ya kusikiliza",
    description:
      "Sikiliza hadithi na ujibu maswali ya ufahamu baada ya kusoma.",
    thumbnail: image(),
    alt: "Audio ya hadithi fupi",
    audioType: "lesson",
    audioFileUrl: "#",
    language: kiswahiliLanguage,
    level: "Darasa la 4",
    subject: getSubjectByName("Kiswahili"),
    syllabus: "Ufahamu",
  },
  {
    _id: "audio-english-1",
    name: "Pronunciation drill",
    description: "Audio ya mazoezi ya matamshi kwa maneno ya kila siku.",
    thumbnail: image(),
    alt: "Audio ya mazoezi ya matamshi",
    audioType: "lesson",
    audioFileUrl: "#",
    language: kiswahiliLanguage,
    level: "Darasa la 3",
    subject: getSubjectByName("English"),
    syllabus: "Listening",
  },
  {
    _id: "audio-uraia-1",
    name: "Maadili mema shuleni",
    description:
      "Somo la sauti kuhusu maadili, ushirikiano na nidhamu ya mwanafunzi.",
    thumbnail: image(),
    alt: "Audio ya maadili mema shuleni",
    audioType: "lesson",
    audioFileUrl: "#",
    language: kiswahiliLanguage,
    level: "Darasa la 5",
    subject: getSubjectByName("Maarifa ya Jamii"),
    syllabus: "Uraia",
  },
];

export type NyumbaniFilterableItem =
  | Subjects
  | Topic
  | Experiment
  | Videos
  | Audios;

export type NyumbaniGroupedItem = Topic | Experiment | Videos | Audios;

export const getNyumbaniSubjectName = (item: NyumbaniFilterableItem) => {
  if ("subject" in item) {
    if (typeof item.subject === "string") return item.subject;
    if (
      item.subject &&
      typeof item.subject === "object" &&
      "name" in item.subject
    ) {
      return item.subject.name;
    }
  }

  return item.name;
};

export const getNyumbaniLevelName = (item: NyumbaniFilterableItem) => {
  if (!("level" in item)) return "";
  return typeof item.level === "string" ? item.level : "";
};

export const groupNyumbaniItemsBySubject = <T extends NyumbaniGroupedItem>(
  items: T[],
): GroupedData<T>[] => {
  const groups = items.reduce<Record<string, T[]>>((accumulator, item) => {
    const key = getNyumbaniSubjectName(item);
    accumulator[key] = accumulator[key] ? [...accumulator[key], item] : [item];
    return accumulator;
  }, {});

  return Object.entries(groups).map(([dataOfKey, data]) => ({
    dataOfKey,
    data,
  }));
};
