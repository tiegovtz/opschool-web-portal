import * as motion from "motion/react-client";
import { Rocket } from "lucide-react";
import { Button } from "./ui/button";

export default function ComingSoon() {
  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-r from-lemon-600 to-blue-400 rounded-lg p-8 text-white text-center"
      >
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Rocket className="h-16 w-16 mb-4 text-lemon-100" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-4xl font-bold mb-2 text-lemon-50"
        >
          Coming Soon!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-lg mb-6 text-lemon-100"
        >
          We&apos;re working on something amazing. Stay tuned!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex space-x-4"
        >
          <Button className="bg-lemon-100 text-blue-600 rounded-full font-semibold hover:bg-lemon-200 transition-all">
            Notify Me
          </Button>
          <Button
            variant="brand"
            className=" border-lemon-100 text-lemon-100 rounded-full font-semibold transition-all"
          >
            Learn More
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
