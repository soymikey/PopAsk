import React, { useEffect, useState } from "react";
import { createWorker } from "tesseract.js";

const App: React.FC = () => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  const handleCapture = async () => {
    try {
      const base64Image =
        await window.go.main.ScreenshotService.CaptureScreen();
      if (base64Image) {
        setScreenshot(base64Image);
        // 使用 Tesseract.js 进行 OCR
        const worker = await createWorker();
        await worker.loadLanguage("eng");
        await worker.initialize("eng");
        const {
          data: { text },
        } = await worker.recognize(base64Image);
        await worker.terminate();
        setOcrResult(text);
      }
    } catch (error) {
      console.error("Error capturing screen:", error);
    }
  };

  useEffect(() => {
    handleCapture();
  }, []);

  return <div>{/* Render your component content here */}</div>;
};

export default App;
