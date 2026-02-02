import { useEffect } from "react";

export function useChatShortcuts(
  activeKey,
  {
    isMac,
    newChatHandler,
    clearChat,
    saveChatHistory,
    stopRequest,
    handleCancelEdit,
    editingMessageId,
    isAskLoading,
    chatMessages,
    chatHistoryList,
    showPromptArea,
  }
) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && e.key === "n") {
        e.preventDefault();
        newChatHandler(chatMessages, chatHistoryList);
      }
      if (isCmdOrCtrl && e.key === "k") {
        e.preventDefault();
        clearChat();
      }
      if (isCmdOrCtrl && e.key === "s") {
        e.preventDefault();
        if (chatMessages.length > 0) {
          saveChatHistory(chatMessages, chatHistoryList);
        }
      }
      if (e.key === "Escape") {
        if (editingMessageId) {
          handleCancelEdit();
        } else if (isAskLoading) {
          stopRequest();
        }
      }
    };

    if (activeKey === "chat") {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeKey,
    isMac,
    newChatHandler,
    clearChat,
    saveChatHistory,
    stopRequest,
    handleCancelEdit,
    editingMessageId,
    isAskLoading,
    chatMessages,
    chatHistoryList,
    showPromptArea,
  ]);
}
