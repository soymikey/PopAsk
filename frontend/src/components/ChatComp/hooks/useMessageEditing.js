import { useState, useCallback } from "react";

export function useMessageEditing({
  chatMessages,
  messageApi,
  handleChat,
  isAskLoading,
}) {
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent("");
  }, []);

  const handleEditMessage = useCallback((messageId, content) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  }, []);

  const handleChatWithEdit = useCallback(
    (...args) => {
      setEditingMessageId(null);
      setEditingContent("");
      handleChat(...args);
    },
    [handleChat],
  );

  const handleSaveEdit = useCallback(async () => {
    if (!editingContent.trim()) {
      messageApi.open({ type: "warning", content: "Please enter a message" });
      return;
    }
    if (!editingMessageId) return;
    const messageIndex = chatMessages.findIndex(
      (msg) => msg.id === editingMessageId,
    );
    if (messageIndex === -1) return;
    await handleChatWithEdit(
      editingContent.trim(),
      false,
      true,
      false,
      messageIndex,
    );
    setEditingMessageId(null);
    setEditingContent("");
  }, [
    editingContent,
    editingMessageId,
    chatMessages,
    handleChatWithEdit,
    messageApi,
  ]);

  const handleRegenerateResponse = useCallback(
    async (messageId) => {
      if (isAskLoading) return;
      const messageIndex = chatMessages.findIndex(
        (msg) => msg.id === messageId,
      );
      if (messageIndex <= 0) return;
      const prevUserMessage = chatMessages[messageIndex - 1];
      if (!prevUserMessage || prevUserMessage.type !== "user") return;
      handleCancelEdit();
      await handleChatWithEdit(
        prevUserMessage.content,
        false,
        false,
        true,
        messageIndex,
      );
    },
    [isAskLoading, chatMessages, handleChatWithEdit, handleCancelEdit],
  );

  return {
    editingMessageId,
    editingContent,
    setEditingContent,
    handleCancelEdit,
    handleEditMessage,
    handleSaveEdit,
    handleRegenerateResponse,
    handleChatWithEdit,
  };
}
