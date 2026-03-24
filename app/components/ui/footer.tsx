import { TieAppIcon } from "@/assets/icons/brand";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-t from-picton-blue-200 to-transparent">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between py-6 md:py-8 gap-4 md:gap-0">
        <div className="flex items-center space-x-4">
          <TieAppIcon size={40} />
          <span className="text-lg md:text-xl">TIE ONLINE PUBLIC SCHOOL</span>
        </div>
        <p
          className="text-picton-blue-900 text-center text-sm md:text-base tracking-wider"
          style={{
            fontFamily: "var(--font-shaky-hand-some-comic)",
          }}
        >
          &copy;
          {new Date().getFullYear()} Tanzania Institute of Education, All Rights
          Reserved.
        </p>
        <div className="w-full md:w-1/4 h-24 overflow-hidden relative">
          <Image
            src="/images/website/tie/unicef-logo.png"
            alt="Feature 1"
            fill
            className="object-contain w-full h-full"
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
