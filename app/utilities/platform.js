import Bowser from "bowser";
import apiDocs from "./apiDocs";

export const webVisitor = async () => {
  // Get platform details from Bowser
  const browser = Bowser.getParser(window.navigator.userAgent);
  const parsed = browser.parse();

  const browserName = parsed.getBrowserName() || "Unknown Browser";
  const osName = parsed.getOSName() || "Unknown OS";

  try {
     await $fetch(apiDocs.visitors.postVisitors, {
      method: "POST",
      body: {
        browser: browserName,
        os: osName,
      },
    });

  } catch (error) {
    console.error(error);
  }
};
