import * as pdfjsLib from "pdfjs-dist";
import "./pdfjsWorker"; // Import the worker setup

export const convertPdfToImages = async (pdfUrl) => {
  try {
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    const totalPages = pdf.numPages;
    const images = [];

    // Loop through each page and render it as an image
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      // Get the viewport (scale 1.0 is the original size, adjust to fit container)
      const viewport = page.getViewport({ scale: 2.0 });

      // Create a canvas element to render the page
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      // Set canvas size to match the viewport
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render the page into the canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert the canvas to a data URL (image)
      const imgUrl = canvas.toDataURL("image/png");
      images.push(imgUrl);
    }
    return images;
  } catch (error) {
    console.error("Error converting PDF to images:", error);
    throw error;
  }
};
