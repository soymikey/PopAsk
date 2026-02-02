import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { useAppStore } from "../../../store";
import {
  syncShortcutListToBackend,
  validateShortcut,
} from "../../../utils";
import { DEFAULT_OCR_LANG, DEFAULT_PROMPT_LIST } from "../../../constant";

export function useSettingsForm(activeKey) {
  const promptList = useAppStore((s) => s.promptList);
  const setPromptList = useAppStore((s) => s.setPromptList);
  const systemShortcuts = useAppStore((s) => s.systemShortcuts);
  const setSystemShortcuts = useAppStore((s) => s.setSystemShortcuts);
  const OCRLang = useAppStore((s) => s.OCRLang);
  const setOCRLang = useAppStore((s) => s.setOCRLang);
  const openAIKey = useAppStore((s) => s.openAIKey);
  const setOpenAIKey = useAppStore((s) => s.setOpenAIKey);

  const [messageApi, contextHolder] = message.useMessage();
  const [localOCRLang, setLocalOCRLang] = useState(DEFAULT_OCR_LANG);
  const [localOpenAIKey, setLocalOpenAIKey] = useState("");
  const [localPromptList, setLocalPromptList] = useState(DEFAULT_PROMPT_LIST);
  const [localSystemShortcuts, setLocalSystemShortcuts] = useState([]);
  const [newlyAddedPromptId, setNewlyAddedPromptId] = useState(null);

  useEffect(() => {
    setLocalPromptList(promptList);
  }, [promptList]);

  useEffect(() => {
    setLocalSystemShortcuts(systemShortcuts);
  }, [systemShortcuts]);

  useEffect(() => {
    setLocalOCRLang(OCRLang);
  }, [OCRLang]);

  useEffect(() => {
    if (activeKey === "settings") {
      setLocalOCRLang(OCRLang);
      setLocalOpenAIKey(openAIKey ?? "");
      setLocalPromptList(promptList);
      setLocalSystemShortcuts(systemShortcuts);
    }
  }, [activeKey, OCRLang, openAIKey, promptList, systemShortcuts]);

  const onChangeOCRHandler = useCallback(
    (value) => {
      if (value.length > 5) {
        messageApi.open({
          type: "error",
          content: "can't select more than 5 languages",
        });
        return;
      }
      setLocalOCRLang(value);
    },
    [messageApi]
  );

  const handleSave = useCallback(() => {
    const result = validateShortcut(localPromptList, localSystemShortcuts);
    if (result.error) {
      messageApi.open({ type: "error", content: result.message });
      return;
    }
    setOCRLang(localOCRLang);
    setOpenAIKey(localOpenAIKey);
    setPromptList(localPromptList);
    setSystemShortcuts(localSystemShortcuts);
    syncShortcutListToBackend(localPromptList, localSystemShortcuts);
    messageApi.open({
      type: "success",
      content: "Settings saved successfully",
    });
  }, [
    localOCRLang,
    localOpenAIKey,
    localPromptList,
    localSystemShortcuts,
    setOCRLang,
    setOpenAIKey,
    setPromptList,
    setSystemShortcuts,
    messageApi,
  ]);

  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      const items = Array.from(localPromptList);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      if (JSON.stringify(items) === JSON.stringify(localPromptList)) return;
      setLocalPromptList(items);
    },
    [localPromptList]
  );

  const addCustomPrompt = useCallback(() => {
    const hasIncompleteCustom = localPromptList.some(
      (p) =>
        p?.id?.startsWith?.("custom_") &&
        (!p.label?.trim() || !p.value?.trim())
    );
    if (hasIncompleteCustom) {
      messageApi.warning(
        "Finish editing the current custom prompt (name and content) first."
      );
      return;
    }
    const newItem = {
      id: `custom_${Date.now()}`,
      label: "",
      value: "",
      shortcut: "",
    };
    setNewlyAddedPromptId(newItem.id);
    setLocalPromptList([newItem, ...localPromptList]);
  }, [localPromptList, messageApi]);

  return {
    contextHolder,
    localOCRLang,
    setLocalOCRLang,
    localOpenAIKey,
    setLocalOpenAIKey,
    localPromptList,
    setLocalPromptList,
    localSystemShortcuts,
    setLocalSystemShortcuts,
    newlyAddedPromptId,
    setNewlyAddedPromptId,
    onChangeOCRHandler,
    handleSave,
    handleDragEnd,
    addCustomPrompt,
  };
}
