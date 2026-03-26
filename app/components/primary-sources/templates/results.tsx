import Image from "next/image";

import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type TActivityResultsProps = {
  score: number;
  total: number;
  onRestart: () => void;
  className?: string;
};

const ActivityResults = ({
  score,
  total,
  onRestart,
  className,
}: TActivityResultsProps) => {
  return (
    <div
      className={cn(
        "mt-2 p-2 md:p-4 bg-white rounded-md shadow-sm md:text-xl",
        className,
      )}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Matokeo</h3>
        <Button size="sm" onClick={onRestart} variant="brand-lemon">
          {score >= total ? "Fanya tena" : "Jaribu tena"}
        </Button>
      </div>
      <p className="mt-2">
        Umepata alama {score} kati ya {total}
      </p>
    </div>
  );
};

type TActivityResultsAlertDialogProps = {
  score?: number;
  total?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCompletionOnly?: boolean;
  completionMessage?: string;
};

// Video mapping based on score percentage
// const getVideoSrcByScore = (scorePercentage: number): string => {
//   if (scorePercentage >= 91) return "/videos/91-100.mp4";
//   if (scorePercentage >= 61) return "/videos/61-90.mp4";
//   if (scorePercentage >= 31) return "/videos/31-60.mp4";
//   if (scorePercentage >= 10) return "/videos/10-30.mp4";
//   return "/videos/0-9.mp4";
// };

// Preload all videos to reduce delay
// const preloadVideos = (): void => {
//   const videoSources = [
//     "/videos/91-100.mp4",
//     "/videos/61-90.mp4",
//     "/videos/31-60.mp4",
//     "/videos/10-30.mp4",
//     "/videos/0-9.mp4",
//   ];

//   videoSources.forEach((src) => {
//     const link = document.createElement("link");
//     link.rel = "preload";
//     link.href = src;
//     link.type = "video/mp4";
//     document.head.appendChild(link);
//   });
// };

export const ActivityResultsAlertDialog = ({
  score,
  total,
  open,
  onOpenChange,
  isCompletionOnly = false,
  completionMessage,
}: TActivityResultsAlertDialogProps) => {
  // const videoRef = useRef<HTMLVideoElement>(null);
  // const [videoLoaded, setVideoLoaded] = useState(false);
  // const [videoEnded, setVideoEnded] = useState(false);

  // Calculate score percentage
  // const scorePercentage =
  //   total && total > 0 ? Number(((score! / total) * 100).toFixed(1)) : 0;

  // Get video source based on score percentage
  // const videoSrc = getVideoSrcByScore(scorePercentage);

  // Preload videos on component mount
  // useEffect(() => {
  //   preloadVideos();
  // }, []);

  // Reset states when modal opens/closes
  // useEffect(() => {
  //   if (!open) {
  //     setVideoLoaded(false);
  //     setVideoEnded(false);
  //   } else {
  //     setVideoEnded(false);

  //     // Pre-fetch the video that will be played to ensure it's ready
  //     if (!videoLoaded) {
  //       const preloadVideo = new Audio(videoSrc);
  //       preloadVideo.preload = "auto";
  //       // No need to play it, just force the browser to fetch it
  //     }
  //   }
  // }, [open, videoSrc, videoLoaded]);

  // Play video when modal is open and video is loaded
  // useEffect(() => {
  //   if (open && videoRef.current && !videoEnded) {
  //     // Immediate play attempt instead of timeout
  //     if (videoRef.current) {
  //       videoRef.current.currentTime = 0;

  //       const playPromise = videoRef.current.play();
  //       if (playPromise !== undefined) {
  //         playPromise
  //           .then(() => {
  //             console.log("Video playing successfully");
  //           })
  //           .catch((error) => {
  //             console.error("Error playing video:", error);
  //             // Try to play without sound as a fallback
  //             if (videoRef.current) {
  //               videoRef.current.muted = true;
  //               videoRef.current
  //                 .play()
  //                 .catch((e) =>
  //                   console.error("Failed even with muted video:", e),
  //                 );
  //             }
  //           });
  //       }
  //     }
  //   }
  // }, [open, videoLoaded, videoEnded]);

  // If it's a completion-only activity
  if (isCompletionOnly) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="bg-white rounded-md shadow-sm text-center">
          <AlertDialogHeader>
            <AlertDialogTitle hidden>Imeisha</AlertDialogTitle>
            <div className="flex bg-lemon-100 h-44 justify-center items-center text-5xl mb-4">
              <Image
                src="/images/activities/result-modal/perfect.png"
                alt="Completion Emoji"
                width={200}
                height={200}
                className="w-32 h-32 object-cover"
              />
            </div>
            <h2 className="text-4xl text-center text-picton-blue-700 font-semibold mb-4">
              Inapendeza! <span className="text-lemon-700">Safi sana!</span>
            </h2>
          </AlertDialogHeader>
          <div className="text-picton-blue-700 text-lg">
            <AlertDialogDescription className="text-picton-blue-700 font-medium text-[17px]">
              {completionMessage ||
                "Umefanikiwa kumaliza shughuli ya ujifunzaji! Kazi nzuri sana."}
            </AlertDialogDescription>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction className="w-full bg-lemon-700 text-lemon-50 hover:bg-lemon-700/90">
              Fanya Tena
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Calculate score percentage
  const scorePercentage =
    total && total > 0 ? Number(((score! / total) * 100).toFixed(1)) : 0;

  // Determine emoji based on score percentage
  let emoji = "";
  if (scorePercentage === 100)
    emoji = "/images/activities/result-modal/perfect.png";
  else if (scorePercentage >= 50)
    emoji = "/images/activities/result-modal/good.png";
  else if (scorePercentage > 0)
    emoji = "/images/activities/result-modal/ok.png";
  else emoji = "/images/activities/result-modal/bad.png";

  // Determine title based on score percentage
  let title = "";
  let titleSpan = "";
  if (scorePercentage >= 91) {
    title = "Inapendeza Mno! ";
    titleSpan = "";
  } else if (scorePercentage >= 61) {
    title = "Kazi Nzuri Sana! ";
    titleSpan = "";
  } else if (scorePercentage >= 31) {
    title = "Maendeleo Mazuri! ";
    titleSpan = "Endelea kujifunza!";
  } else if (scorePercentage >= 10) {
    title = "Karibu Ufikie! ";
    titleSpan = "Jaribu tena!";
  } else {
    title = "";
    titleSpan = "Jaribu tena!";
  }

  // Determine message based on score percentage
  let message = "";
  if (scorePercentage >= 91) {
    message = `Umepata maswali ${score} kati ya ${total}! Kazi nzuri sana!`;
  } else if (scorePercentage >= 61) {
    message = `Hongera! Umepata maswali ${score} kati ya ${total}. unafanya kazi nzuri!`;
  } else if (scorePercentage >= 31) {
    message = `kazi nzuri! Umepata maswali ${score} kati ya ${total}. Endelea kufanya mazoezi!`;
  } else {
    message = `Umepata maswali ${score} kati ya ${total}. Endelea kufanya mazoezi zaidi ili uwe bora`;
  }

  // Static image to show after video ends
  // const staticImageSrc = videoSrc.replace(".mp4", ".png");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white rounded-md shadow-sm text-center w-[90%] sm:w-full p-2 md:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle hidden>The Result</AlertDialogTitle>
          <div className="flex bg-lemon-100 h-44 justify-center items-center text-5xl mb-4">
            <Image
              src={emoji}
              alt="Result Emoji"
              width={200}
              height={200}
              className="w-32 h-32 object-cover"
            />
          </div>
          <h2 className="text-2xl md:text-4xl text-center text-picton-blue-700 font-semibold mb-4">
            {title}
            <span className="text-lemon-700">{titleSpan}</span>
          </h2>
        </AlertDialogHeader>
        <div className="text-picton-blue-700 text-lg">
          <AlertDialogDescription className="text-picton-blue-700 font-medium text-[17px]">
            {completionMessage || message}
          </AlertDialogDescription>
          <p className="mt-2 font-bold text-picton-blue-700">
            Alama: <span className="text-lemon-700">{scorePercentage}%</span>
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction className="w-full bg-lemon-700 text-lemon-50 hover:bg-lemon-700/90">
            Funga
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ActivityResults;
