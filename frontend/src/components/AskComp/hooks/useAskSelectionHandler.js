import { useEffect, useCallback } from "react";
import { EventsOn, EventsOff } from "../../../../wailsjs/runtime/runtime";
import { WindowShow } from "../../../../wailsjs/runtime/runtime";
import {
  messageGenerator,
  languageFormate,
  getLocalStorage,
} from "../../../utils";
import { DEFAULT_ORC_LANG, ORC_LANG_KEY } from "../../../constant";

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
          const ORCLang = getLocalStorage(ORC_LANG_KEY, DEFAULT_ORC_LANG);
          const lang =
            ORCLang?.length > 1
              ? ORCLang.join("+")
              : (ORCLang?.[0] ?? "eng");
          const { default: Tesseract } = await import("tesseract.js");
          const result = await Tesseract.recognize(text, lang);
          text = languageFormate(result?.data?.text || "");
        }
        if (text.length === 0) {
          setIsLoading(false);
          return;
        }
        let prompt_ = prompt;
        if (isOpenWindow || isOCR) {
          prompt_ = selectedPrompt;
        }
        setSelectedPrompt(prompt_);
        setSelection(messageGenerator(prompt_, text));
        if (setChatResponse) setChatResponse(null);
        if (autoAsking) {
          handleChat(messageGenerator(prompt_, text));
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
