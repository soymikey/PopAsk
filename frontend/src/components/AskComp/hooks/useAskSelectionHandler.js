import { useEffect, useCallback } from "react";
import { EventsOn, EventsOff } from "../../../../wailsjs/runtime/runtime";
import { WindowShow } from "../../../../wailsjs/runtime/runtime";
import {
  messageGenerator,
  languageFormat,
  getLocalStorage,
} from "../../../utils";
import { DEFAULT_OCR_LANG, OCR_LANG_KEY } from "../../../constant";

export function useAskSelectionHandler({
  setActiveKey,
  selectedPrompt,
  setSelectedPrompt,
  setSelection,
  setChatResponse,
  handleChat,
  messageApi,
  setIsLoading,
}) {
  const onSelectionHandler = useCallback(
    async (selectionData) => {
      try {
        const {
          text: selectionText,
          prompt,
          autoAsking,
          isOCR,
          isOpenWindow,
        } = selectionData;
        let text = selectionText ?? "";
        WindowShow();
        setActiveKey("ask");
        setIsLoading(true);
        if (isOCR) {
          const OCRLang = getLocalStorage(OCR_LANG_KEY, DEFAULT_OCR_LANG);
          const lang =
            OCRLang?.length > 1
              ? OCRLang.join("+")
              : (OCRLang?.[0] ?? "eng");
          const { default: Tesseract } = await import("tesseract.js");
          const result = await Tesseract.recognize(text, lang);
          text = languageFormat(result?.data?.text || "");
        }
        if (text.length === 0) {
          setIsLoading(false);
          return;
        }
        const effectivePrompt = isOpenWindow || isOCR ? selectedPrompt : prompt;
        setSelectedPrompt(effectivePrompt);
        setSelection(messageGenerator(effectivePrompt, text));
        if (setChatResponse) setChatResponse(null);
        if (autoAsking) {
          handleChat(messageGenerator(effectivePrompt, text));
        }
      } catch (error) {
        messageApi.open({
          type: "error",
          content: error?.message || "error",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      setActiveKey,
      selectedPrompt,
      setSelectedPrompt,
      setSelection,
      setChatResponse,
      handleChat,
      messageApi,
      setIsLoading,
    ]
  );

  useEffect(() => {
    EventsOn("GET_SELECTION", onSelectionHandler);
    return () => EventsOff("GET_SELECTION");
  }, [onSelectionHandler]);

  return { onSelectionHandler };
}
