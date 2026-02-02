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

function normalizeResponseData(data) {
  if (data == null) return "";
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed.content === "string") return parsed.content;
    } catch {
      // not JSON, use as-is
    }
    return data;
  }
  if (typeof data === "object" && typeof data.content === "string")
    return data.content;
  return String(data);
}

function validateChatRequest(messages, isAskLoading, usageInfo, messageApi) {
  if (isAskLoading) {
    messageApi.open({
      type: "warning",
      content: "Please wait for the current request to complete",
    });
    return false;
  }
  if (!messages.trim()) {
    messageApi.open({ type: "warning", content: "Please enter a message" });
    return false;
  }
  if (!usageInfo.canUse) {
    messageApi.open({
      type: "warning",
      content: `Daily usage limit reached (${usageInfo.limit} times), please try again tomorrow`,
    });
    return false;
  }
  return true;
}

function buildChatMessages(currentMessages, messages, options) {
  const { isNewChat, isEdit, isRegenerate, messageIndex } = options;
  if (isNewChat) return [userMessageGenerator(messages)];
  if (isEdit && messageIndex !== -1) {
    return [
      ...currentMessages.slice(0, messageIndex),
      userMessageGenerator(messages),
    ];
  }
  if (isRegenerate && messageIndex != null && messageIndex >= 0) {
    return [...currentMessages.slice(0, messageIndex)];
  }
  return [...currentMessages, userMessageGenerator(messages)];
}

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
    messageApi.open({ type: "info", content: "Request stopped" });
  }, [messageApi]);

  const handleChat = useCallback(
    async (messages, options = {}) => {
      const {
        isNewChat = false,
        isEdit = false,
        isRegenerate = false,
        messageIndex = null,
      } = typeof options === "object" && options !== null
        ? options
        : { isNewChat: !!options };

      const usageInfo = checkDailyUsageLimit(DEFAULT_DAILY_LIMIT);
      if (
        !validateChatRequest(
          messages,
          isAskLoading,
          usageInfo,
          messageApi,
        )
      ) {
        return;
      }

      isRequestCancelledRef.current = false;
      const newChatMessages = buildChatMessages(
        chatMessagesRef.current,
        messages,
        { isNewChat, isEdit, isRegenerate, messageIndex },
      );
      setChatMessages(newChatMessages);
      setIsAskLoading(true);

      try {
        const params = newChatMessages.map((m) => ({
          role: m.type,
          content: m.content,
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
          const content = normalizeResponseData(response.data);
          setChatMessages((prev) => [...prev, assistantMessageGenerator(content)]);

          const prompt = promptList.find(
            (p) => p.value === selectedPromptRef.current,
          );
          if (prompt) {
            setRecentPrompts((prev) => {
              const filtered = prev.filter((p) => p.label !== prompt.label);
              return [prompt, ...filtered].slice(0, 12);
            });
          }
          const remaining = DEFAULT_DAILY_LIMIT - newCount;
          if (remaining <= 2) {
            messageApi.open({
              type: "info",
              content: `Remaining daily usage: ${remaining} times`,
            });
          }
        } else {
          messageApi.open({
            type: "error",
            content: normalizeResponseData(response.data),
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
    ],
  );

  return { handleChat, isAskLoading, stopRequest };
}
