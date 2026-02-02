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
    (messages, optionsOrIsNewChat, isEdit, isRegenerate, messageIndex) => {
      setEditingMessageId(null);
      setEditingContent("");
      if (messageIndex !== undefined) {
        handleChat(messages, {
          isNewChat: !!optionsOrIsNewChat,
          isEdit: !!isEdit,
          isRegenerate: !!isRegenerate,
          messageIndex,
        });
      } else {
        handleChat(
          messages,
          typeof optionsOrIsNewChat === "object" && optionsOrIsNewChat !== null
            ? optionsOrIsNewChat
            : { isNewChat: !!optionsOrIsNewChat },
        );
      }
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
    setEditingMessageId(null);
    setEditingContent("");
    await handleChat(editingContent.trim(), {
      isEdit: true,
      messageIndex,
    });
  }, [
    editingContent,
    editingMessageId,
    chatMessages,
    handleChat,
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
      await handleChat(prevUserMessage.content, {
        isRegenerate: true,
        messageIndex,
      });
    },
    [isAskLoading, chatMessages, handleChat, handleCancelEdit],
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
