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
  languageFormat,
  getLocalStorage,
  sleep,
} from "../../../utils";
import { DEFAULT_OCR_LANG, OCR_LANG_KEY } from "../../../constant";

const OCR_TIMEOUT_MS = 10000;
const FOCUS_DELAY_MS = 100;

function focusWindow(isMac) {
  WindowCenter();
  if (isMac) {
    WindowShow();
  } else {
    WindowSetAlwaysOnTop(true);
    setTimeout(() => WindowSetAlwaysOnTop(false), 1000);
  }
}

async function runOCRFlow(text, messageApi, setIsLoading) {
  setIsLoading(true);
  let timeoutId = setTimeout(() => {
    messageApi.open({
      type: "error",
      content: "OCR failed: Please check your network",
    });
    setIsLoading(false);
  }, OCR_TIMEOUT_MS);
  const OCRLang = getLocalStorage(OCR_LANG_KEY, DEFAULT_OCR_LANG);
  const lang =
    OCRLang?.length > 1 ? OCRLang.join("+") : (OCRLang?.[0] ?? "eng");
  const { default: Tesseract } = await import("tesseract.js");
  const result = await Tesseract.recognize(text, lang);
  clearTimeout(timeoutId);
  setIsLoading(false);
  return languageFormat(result?.data?.text || "");
}

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
      try {
        const { shortcut, prompt, autoAsking, isOCR, isOpenWindow } =
          selectionData ?? {};
        const isOpenWindowOnly =
          shortcut === "Open Window" ||
          (isOpenWindow && !isOCR && !autoAsking);

        focusWindow(isMac);
        setActiveKey("chat");

        if (isOpenWindowOnly) {
          await sleep(FOCUS_DELAY_MS);
          inputRef.current?.focus();
          return;
        }

        let text = selectionData?.text ?? "";
        if (isOCR) {
          text = await runOCRFlow(text, messageApi, setIsLoading);
        }
        if (text.length === 0) {
          await sleep(FOCUS_DELAY_MS);
          inputRef.current?.focus();
          return;
        }

        const effectivePrompt = isOpenWindow || isOCR ? selectedPrompt : prompt;
        newChatHandler(chatMessages, chatHistoryList);
        setSelectedPrompt(effectivePrompt);
        const formattedMessage = messageGenerator(effectivePrompt, text);
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
        await sleep(FOCUS_DELAY_MS);
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
    ],
  );

  useEffect(() => {
    EventsOn("GET_SELECTION", onSelectionHandler);
    return () => EventsOff("GET_SELECTION");
  }, [onSelectionHandler]);

  return { onSelectionHandler };
}
