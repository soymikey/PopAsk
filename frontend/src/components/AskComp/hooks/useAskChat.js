import { useState, useCallback } from "react";
import { ChatAPI } from "../../../../wailsjs/go/main/App";
import { useAppStore } from "../../../store";
import { historyGenerator } from "../../../utils";

export function useAskChat({
  promptList,
  selectedPrompt,
  historyList,
  setHistoryList,
  messageApi,
}) {
  const setRecentPrompts = useAppStore((s) => s.setRecentPrompts);
  const [chatResponse, setChatResponse] = useState(null);
  const [isAskLoading, setIsAskLoading] = useState(false);

  const handleChat = useCallback(
    async (message) => {
      setChatResponse(null);
      setIsAskLoading(true);
      const response = await ChatAPI(message);
      setIsAskLoading(false);
      if (response.code === 200) {
        setChatResponse(response.data);
        setHistoryList([
          historyGenerator(message, response.data),
          ...historyList,
        ]);
        const prompt = promptList.find((p) => p.value === selectedPrompt);
        if (prompt) {
          setRecentPrompts((prev) => {
            const filteredPrompts = prev.filter(
              (p) => p.label !== prompt.label
            );
            return [prompt, ...filteredPrompts].slice(0, 12);
          });
        }
      } else {
        messageApi.open({
          type: "error",
          content: response.data,
        });
      }
    },
    [
      promptList,
      selectedPrompt,
      historyList,
      setHistoryList,
      setRecentPrompts,
      messageApi,
    ]
  );

  return { chatResponse, setChatResponse, isAskLoading, handleChat };
}
