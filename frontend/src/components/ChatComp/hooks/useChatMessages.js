import { useState, useRef, useEffect, useCallback } from "react";
import { CustomOpenAIAPI, OpenAIAPI } from "../../../../wailsjs/go/main/App";
import { useAppStore } from "../../../store";
import {
  userMessageGenerator,
  assistantMessageGenerator,
  checkDailyUsageLimit,
  incrementDailyUsageCount,
} from "../../../utils";
import { DEFAULT_DAILY_LIMIT } from "../../../constant";

export function useChatMessages(chatMessages, setChatMessages, messageApi) {
  const promptList = useAppStore((s) => s.promptList);
  const selectedPrompt = useAppStore((s) => s.selectedPrompt);
  const openAIKey = useAppStore((s) => s.openAIKey);
  const setRecentPrompts = useAppStore((s) => s.setRecentPrompts);

  const chatMessagesRef = useRef(chatMessages);
  const openAIKeyRef = useRef(openAIKey);
  const selectedPromptRef = useRef(selectedPrompt);
  const isRequestCancelledRef = useRef(false);

  const [isAskLoading, setIsAskLoading] = useState(false);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);
  useEffect(() => {
    openAIKeyRef.current = openAIKey;
  }, [openAIKey]);
  useEffect(() => {
    selectedPromptRef.current = selectedPrompt;
  }, [selectedPrompt]);

  const stopRequest = useCallback(() => {
    isRequestCancelledRef.current = true;
    setIsAskLoading(false);
    messageApi.open({
      type: "info",
      content: "Request stopped",
    });
  }, [messageApi]);

  const handleChat = useCallback(
    async (
      messages,
      isNewChat = false,
      isEdit = false,
      isRegenerate = false,
      messageIndex = null
    ) => {
      if (isAskLoading) {
        messageApi.open({
          type: "warning",
          content: "Please wait for the current request to complete",
        });
        return;
      }
      if (!messages.trim()) {
        messageApi.open({
          type: "warning",
          content: "Please enter a message",
        });
        return;
      }

      const usageInfo = checkDailyUsageLimit(DEFAULT_DAILY_LIMIT);
      if (!usageInfo.canUse) {
        messageApi.open({
          type: "warning",
          content: `Daily usage limit reached (${usageInfo.limit} times), please try again tomorrow`,
        });
        return;
      }

      isRequestCancelledRef.current = false;

      let newChatMessages = [];
      if (isNewChat) {
        newChatMessages = [userMessageGenerator(messages)];
      } else if (isEdit) {
        if (messageIndex === -1) return;
        newChatMessages = [
          ...chatMessagesRef.current.slice(0, messageIndex),
          userMessageGenerator(messages),
        ];
      } else if (isRegenerate) {
        if (messageIndex == null || messageIndex < 0) return;
        newChatMessages = [...chatMessagesRef.current.slice(0, messageIndex)];
      } else {
        newChatMessages = [
          ...chatMessagesRef.current,
          userMessageGenerator(messages),
        ];
      }
      setChatMessages(newChatMessages);
      setIsAskLoading(true);

      try {
        const params = newChatMessages.map((message) => ({
          role: message.type,
          content: message.content,
        }));
        const key = openAIKeyRef.current?.trim() ?? "";
        const response =
          key !== ""
            ? await CustomOpenAIAPI(JSON.stringify(params), key)
            : await OpenAIAPI(JSON.stringify(params));

        if (isRequestCancelledRef.current) return;

        setIsAskLoading(false);
        if (response.code === 200) {
          const newCount = incrementDailyUsageCount();
          const assistantMessage = assistantMessageGenerator(response.data);
          setChatMessages((prev) => [...prev, assistantMessage]);

          const prompt = promptList.find(
            (p) => p.value === selectedPromptRef.current
          );
          if (prompt) {
            setRecentPrompts((prev) => {
              const filteredPrompts = prev.filter(
                (p) => p.label !== prompt.label
              );
              return [prompt, ...filteredPrompts].slice(0, 12);
            });
          }

          const remainingCount = DEFAULT_DAILY_LIMIT - newCount;
          if (remainingCount <= 2) {
            messageApi.open({
              type: "info",
              content: `Remaining daily usage: ${remainingCount} times`,
            });
          }
        } else {
          messageApi.open({
            type: "error",
            content: response.data,
          });
        }
      } catch (error) {
        if (isRequestCancelledRef.current) return;
        setIsAskLoading(false);
        messageApi.open({
          type: "error",
          content: error?.message || "Failed to get response",
        });
      }
    },
    [
      isAskLoading,
      messageApi,
      setChatMessages,
      promptList,
      setRecentPrompts,
    ]
  );

  return { handleChat, isAskLoading, stopRequest };
}
