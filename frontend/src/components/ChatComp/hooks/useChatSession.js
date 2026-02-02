import { useCallback } from "react";

export function useChatSession({
  chatMessages,
  setChatMessages,
  setChatHistoryList,
  isAskLoading,
  messageApi,
}) {
  const saveChatHistory = useCallback(
    (messages, historyList) => {
      if (isAskLoading || messages.length === 0) return;
      if (
        historyList.length > 0 &&
        historyList.some(
          (h) =>
            h.length === messages.length &&
            h.every((m, i) => m.content === messages[i]?.content),
        )
      ) {
        setChatMessages([]);
        return;
      }
      setChatHistoryList([messages, ...historyList]);
      setChatMessages([]);
    },
    [isAskLoading, setChatMessages, setChatHistoryList],
  );

  const newChatHandler = useCallback(
    (messages, historyList) => {
      if (isAskLoading) return;
      setChatMessages([]);
      saveChatHistory(messages, historyList);
    },
    [isAskLoading, setChatMessages, saveChatHistory],
  );

  const clearChat = useCallback(() => {
    if (isAskLoading) return;
    setChatMessages([]);
    messageApi.open({ type: "success", content: "Chat cleared" });
  }, [isAskLoading, setChatMessages, messageApi]);

  return { saveChatHistory, newChatHandler, clearChat };
}
