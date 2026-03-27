export type ServerQuestionType = {
  // uuid: string;
  id: number;
  // activityUuid: string;
  // questionId: string;
  // title: string;
  description: Array<{
    id: number;
    details: string;
  }> | null;
  // audio: null;
  // video: null;
  // images: null;
  textOne: string | null;
  textTwo: string | null;
  textThree: string | null;
  textFour: string | null;
  textFive: string | null;
  textSix: string | null;
  textSeven: string | null;
  textEight: string | null;
  textNine: string | null;
  textTen: string | null;
  // description: null;
  audioPath: string | null;
  videoPath: string | null;
  image: string | null;
  imageTwo: string | null;
  imageThree: string | null;
  imageFour: string | null;
  path: string | null;
  pathTwo: string | null;
  pathThree: string | null;
  pathFour: string | null;
};

///////////////////////////////////////////////////
