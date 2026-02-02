import { useEffect, useCallback } from "react";
import {
  EventsOn,
  EventsOff,
  WindowCenter,
  WindowShow,
  WindowSetAlwaysOnTop,
} from "../../../../wailsjs/runtime/runtime";
import {
  messageGenerator,
  languageFormate,
  getLocalStorage,
  sleep,
} from "../../../utils";
import { DEFAULT_ORC_LANG, ORC_LANG_KEY } from "../../../constant";

export function useSelectionHandler({
  isMac,
  setActiveKey,
  messageApi,
  selectedPrompt,
  setSelectedPrompt,
  newChatHandler,
  chatMessages,
  chatHistoryList,
  handleChatWithEdit,
  setSelection,
  setIsLoading,
  inputRef,
}) {
  const onSelectionHandler = useCallback(
    async (selectionData) => {
      let timeoutId = null;
      try {
        const { shortcut, prompt, autoAsking, isOCR, isOpenWindow } =
          selectionData;
        const isOpenWindowOnly =
          shortcut === "Open Window" || (isOpenWindow && !isOCR && !autoAsking);

        if (isMac) {
          WindowCenter();
          WindowShow();
        } else {
          WindowCenter();
          WindowSetAlwaysOnTop(true);
          setTimeout(() => WindowSetAlwaysOnTop(false), 1000);
        }
        setActiveKey("chat");

        if (isOpenWindowOnly) {
          await sleep(100);
          inputRef.current?.focus();
          return;
        }

        let text = selectionData?.text || "";
        if (isOCR) {
          setIsLoading(true);
          timeoutId = setTimeout(() => {
            messageApi.open({
              type: "error",
              content: "OCR failed: Please check your network",
            });
            setIsLoading(false);
          }, 10000);
          const ORCLang = getLocalStorage(ORC_LANG_KEY, DEFAULT_ORC_LANG);
          const lang =
            ORCLang?.length > 1
              ? ORCLang.join("+")
              : (ORCLang?.[0] ?? "eng");
          const { default: Tesseract } = await import("tesseract.js");
          const result = await Tesseract.recognize(text, lang);
          text = languageFormate(result?.data?.text || "");
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
        if (text.length === 0) return;
        let prompt_ = prompt;
        if (isOpenWindow || isOCR) {
          prompt_ = selectedPrompt;
        }
        newChatHandler(chatMessages, chatHistoryList);
        setSelectedPrompt(prompt_);
        const formattedMessage = messageGenerator(prompt_, text);
        setSelection(formattedMessage);
        if (autoAsking) {
          setSelection("");
          await handleChatWithEdit(formattedMessage, true);
        }
      } catch (error) {
        messageApi.open({
          type: "error",
          content: error?.message || "error",
        });
      } finally {
        await sleep(100);
        inputRef.current?.focus();
      }
    },
    [
      isMac,
      setActiveKey,
      messageApi,
      selectedPrompt,
      setSelectedPrompt,
      newChatHandler,
      chatMessages,
      chatHistoryList,
      handleChatWithEdit,
      setSelection,
      setIsLoading,
      inputRef,
    ]
  );

  useEffect(() => {
    EventsOn("GET_SELECTION", onSelectionHandler);
    return () => EventsOff("GET_SELECTION");
  }, [onSelectionHandler]);

  return { onSelectionHandler };
}
