import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';
import worker from 'pdfjs-dist/build/pdf.worker?url';

GlobalWorkerOptions.workerSrc = worker;