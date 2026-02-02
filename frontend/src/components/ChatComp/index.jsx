import {
  Button,
  Layout,
  message,
  Select,
  Input,
  Spin,
  Tag,
  Tooltip,
  Space,
  Modal,
  Form,
  Card,
  Typography,
  Collapse,
  Avatar,
  List,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
  RobotOutlined,
  SettingOutlined,
  LinkOutlined,
  SaveOutlined,
  StopOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useRef } from "react";
import {
  EventsOn,
  EventsOff,
  WindowCenter,
  WindowShow,
  WindowSetAlwaysOnTop,
} from "../../../wailsjs/runtime/runtime";
import {
  AIBianxieAPI,
  OpenAIAPI,
  CustomOpenAIAPI,
  AIOpenHubAPI,
} from "../../../wailsjs/go/main/App";
import { TAG_COLORS } from "../../constant";
import {
  messageGenerator,
  newPromptGenerator,
  languageFormate,
  getLocalStorage,
  historyGenerator,
  userMessageGenerator,
  assistantMessageGenerator,
  checkDailyUsageLimit,
  incrementDailyUsageCount,
  sleep,
  syncShortcutListToBackend,
} from "../../utils";
import "./index.css";
import { useAppStore } from "../../store";
import {
  DEFAULT_ORC_LANG,
  ORC_LANG_KEY,
  DEFAULT_DAILY_LIMIT,
} from "../../constant";
import ChatMessageItem from "./ChatMessageItem";

const { TextArea } = Input;
const { Title, Text } = Typography;

// 快捷键展示：cmd -> ⌘，便于 Mac 用户识别
const formatShortcutDisplay = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.replace(/\bcmd\b/gi, "⌘").replace(/\bshift\b/gi, "Shift").replace(/\bctrl\b/gi, "Ctrl");
};

const ChatComp = ({
  activeKey,
  setActiveKey,
  chatMessages,
  setChatMessages,
}) => {
  const promptList = useAppStore((s) => s.promptList);
  const setPromptList = useAppStore((s) => s.setPromptList);
  const systemShortcuts = useAppStore((s) => s.systemShortcuts);
  const chatHistoryList = useAppStore((s) => s.chatHistoryList);
  const setChatHistoryList = useAppStore((s) => s.setChatHistoryList);
  const selectedPrompt = useAppStore((s) => s.selectedPrompt);
  const setSelectedPrompt = useAppStore((s) => s.setSelectedPrompt);
  const openAIKey = useAppStore((s) => s.openAIKey);
  const newChatText = `New (${window.config_.isMac ? "Cmd" : "Ctrl"}+N)`;

  const clearChatText = `Clear (${window.config_.isMac ? "Cmd" : "Ctrl"}+K)`;
  const saveChatText = `Save (${window.config_.isMac ? "Cmd" : "Ctrl"}+S)`;

  const sendPlaceholderText = `(${
    window.config_.isMac ? "Cmd" : "Ctrl"
  }+Enter to send) (Shift+Enter to send new chat)`;

  const chatHistoryListRef = useRef(chatHistoryList);
  const chatMessagesRef = useRef(chatMessages);
  const selectedPromptRef = useRef(selectedPrompt);
  const openAIKeyRef = useRef(openAIKey);
  const isRequestCancelledRef = useRef(false);

  useEffect(() => {
    openAIKeyRef.current = openAIKey;
  }, [openAIKey]);

  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const [selection, setSelection] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isAskLoading, setIsAskLoading] = useState(false);

  const recentPrompts = useAppStore((s) => s.recentPrompts);
  const setRecentPrompts = useAppStore((s) => s.setRecentPrompts);
  const showPromptArea = useAppStore((s) => s.showPromptArea);
  const setShowPromptArea = useAppStore((s) => s.setShowPromptArea);

  const askRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const editPrompt = (promptId, newPrompt, newPromptTitle) => {
    const newPrompt_ = newPromptGenerator(newPromptTitle, newPrompt);
    if (!newPrompt_) {
      messageApi.open({
        type: "error",
        content: "Please enter prompt title and prompt",
      });
      return;
    }

    const updatedPromptList = promptList.map((prompt) =>
      prompt.value === promptId ? newPrompt_ : prompt,
    );
    setPromptList(updatedPromptList);
    syncShortcutListToBackend(updatedPromptList, systemShortcuts);

    setIsModalVisible(false);
    setIsEditMode(false);
    setEditingPrompt(null);
    form.resetFields();
    messageApi.open({
      type: "success",
      content: "Prompt updated successfully",
    });
  };

  const handleEditPromptClick = (prompt) => {
    setIsEditMode(true);
    setEditingPrompt(prompt);
    form.setFieldsValue({
      title: prompt.label,
      prompt: prompt.value,
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setIsEditMode(false);
    setEditingPrompt(null);
    form.resetFields();
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (isEditMode && editingPrompt) {
        editPrompt(editingPrompt.value, values.prompt, values.title);
      }
    });
  };

  const stopRequest = () => {
    isRequestCancelledRef.current = true;
    setIsAskLoading(false);
    messageApi.open({
      type: "info",
      content: "Request stopped",
    });
  };

  const handleChat = async (
    messages,
    isNewChat = false,
    isEdit = false,
    isRegenerate = false,
    messageIndex = null,
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

    // Check daily usage limit
    const usageInfo = checkDailyUsageLimit(DEFAULT_DAILY_LIMIT);
    if (!usageInfo.canUse) {
      messageApi.open({
        type: "warning",
        content: `Daily usage limit reached (${usageInfo.limit} times), please try again tomorrow`,
      });
      return;
    }

    handleCancelEdit();

    // Reset cancellation flag
    isRequestCancelledRef.current = false;

    // Add user message to chat
    let newChatMessages = [];
    if (isNewChat) {
      newChatMessages = [userMessageGenerator(messages)];
    } else if (isEdit) {
      if (messageIndex === -1) return;
      newChatMessages = [
        ...chatMessagesRef.current.slice(0, messageIndex),
        userMessageGenerator(messages),
      ];
    } else if (isEdit) {
      newChatMessages = messages;
    } else if (isRegenerate) {
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

      // Check if request was cancelled
      if (isRequestCancelledRef.current) {
        return;
      }

      setIsAskLoading(false);
      if (response.code === 200) {
        // Increment usage count after successful call
        const newCount = incrementDailyUsageCount();

        // Add assistant message to chat
        const assistantMessage = assistantMessageGenerator(response.data);
        setChatMessages((prev) => [...prev, assistantMessage]);

        const prompt = promptList.find(
          (p) => p.value === selectedPromptRef.current,
        );
        if (prompt) {
          setRecentPrompts((prev) => {
            const filteredPrompts = prev.filter(
              (p) => p.label !== prompt.label,
            );
            const newPrompts = [prompt, ...filteredPrompts];
            return newPrompts.slice(0, 12);
          });
        }

        // Show remaining usage count
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
      // Check if request was cancelled
      if (isRequestCancelledRef.current) {
        return;
      }

      setIsAskLoading(false);
      messageApi.open({
        type: "error",
        content: error?.message || "Failed to get response",
      });
    }
  };

  const onSelectionHandler = async (selection) => {
    let timeoutId = null;
    try {
      const { shortcut, prompt, autoAsking, isOCR, isOpenWindow } = selection;
      let text = selection?.text || "";
      if (config_.isMac) {
        WindowCenter();
        WindowShow();
      } else {
        WindowCenter();
        WindowSetAlwaysOnTop(true);
        setTimeout(() => {
          WindowSetAlwaysOnTop(false);
        }, 1000);
      }

      setActiveKey("chat");

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
        const lang = ORCLang.length > 1 ? ORCLang.join("+") : ORCLang[0];
        const { default: Tesseract } = await import("tesseract.js");
        const result = await Tesseract.recognize(text, lang);
        text = languageFormate(result?.data?.text || "");
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
      if (text.length === 0) {
        return;
      }
      let prompt_ = prompt;
      if (isOpenWindow || isOCR) {
        prompt_ = selectedPromptRef.current;
      }
      newChatHandler(chatMessagesRef.current, chatHistoryListRef.current);
      setSelectedPrompt(prompt_);
      const formattedMessage = messageGenerator(prompt_, text);
      setSelection(formattedMessage);

      if (autoAsking) {
        setSelection("");
        await handleChat(formattedMessage, true);
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
  };

  const onSelectPromptHandler = (value) => {
    setSelectedPrompt(value);

    if (value.length === 0) {
      return;
    }
    for (const prompt of promptList) {
      if (selection.startsWith(prompt.value)) {
        const newSelection = selection.slice(prompt.value.length);
        setSelection(messageGenerator(value, newSelection));
        return;
      }
    }
    setSelection(messageGenerator(value, selection));
  };

  const onChangeSelectionHandler = (event) => {
    if (event.target.value.length < selectedPrompt.length - 1) {
      setSelectedPrompt("");
    }
    setSelection(event.target.value);
  };
  const newChatHandler = (chatMessages, chatHistoryList) => {
    if (isAskLoading) {
      return;
    }
    setChatMessages([]);
    saveChatHistory(chatMessages, chatHistoryList);
  };

  const saveChatHistory = (chatMessages, chatHistoryList) => {
    if (isAskLoading) {
      return;
    }
    if (chatMessages.length === 0) {
      return;
    }
    // 如果当前的 chatMessages 已存在于历史中，只清空当前对话
    if (
      chatHistoryList.length > 0 &&
      chatHistoryList.some((history) =>
        history.length === chatMessages.length &&
        history.every(
          (message, index) => message.content === chatMessages[index]?.content,
        ),
      )
    ) {
      setChatMessages([]);
      return;
    }
    // 将当前对话加入历史（放在最前）
    setChatHistoryList([chatMessages, ...chatHistoryList]);
    setChatMessages([]);
  };

  const clearChat = () => {
    if (isAskLoading) {
      return;
    }
    setChatMessages([]);
    messageApi.open({
      type: "success",
      content: "Chat cleared",
    });
  };

  // 编辑消息
  const handleEditMessage = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingContent.trim()) {
      messageApi.open({
        type: "warning",
        content: "Please enter a message",
      });
      return;
    }
    if (!editingMessageId) return;
    // 找到要编辑的消息索引
    const messageIndex = chatMessages.findIndex(
      (msg) => msg.id === editingMessageId,
    );
    if (messageIndex === -1) return;

    await handleChat(editingContent.trim(), false, true, false, messageIndex);
    setEditingMessageId(null);
    setEditingContent("");
  };
  // 取消编辑
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleRegenerateResponse = async (messageId) => {
    if (isAskLoading) {
      return;
    }
    setEditingMessageId(null);
    setEditingContent("");

    // 找到要重新生成的消息索引
    const messageIndex = chatMessages.findIndex((msg) => msg.id === messageId);

    await handleChat("anything", false, false, true, messageIndex);
    // // 移除该消息及其之后的所有消息
    // setChatMessages(messagesToSend);

    // // 重新发送最后一条用户消息
    // const lastUserMessage = messagesToSend[messagesToSend.length - 1];
    // if (lastUserMessage && lastUserMessage.type === "user") {
    //   await handleChat(lastUserMessage.content, false);
    // }
  };

  useEffect(() => {
    EventsOn("GET_SELECTION", (event) => {
      onSelectionHandler(event);
    });

    return () => {
      EventsOff("GET_SELECTION");
    };
  }, []);

  // 更新 ref 值
  useEffect(() => {
    chatHistoryListRef.current = chatHistoryList;
  }, [chatHistoryList]);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    selectedPromptRef.current = selectedPrompt;
  }, [selectedPrompt]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = window.config_.isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + N: 新对话
      if (isCmdOrCtrl && e.key === "n") {
        e.preventDefault();
        newChatHandler(chatMessages, chatHistoryList);
      }

      // Cmd/Ctrl + K: 清空聊天
      if (isCmdOrCtrl && e.key === "k") {
        e.preventDefault();
        clearChat();
      }

      // Cmd/Ctrl + S: 保存聊天记录
      if (isCmdOrCtrl && e.key === "s") {
        e.preventDefault();
        if (chatMessages.length > 0) {
          saveChatHistory(chatMessages, chatHistoryList);
        }
      }

      // Escape: 取消编辑或停止请求
      if (e.key === "Escape") {
        if (editingMessageId) {
          handleCancelEdit();
        } else if (isAskLoading) {
          stopRequest();
        }
      }
    };

    // 只在聊天页面激活时监听快捷键
    if (activeKey === "chat") {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selection,
    isAskLoading,
    chatMessages,
    chatHistoryList,
    editingMessageId,
    editingContent,
    showPromptArea,
  ]);

  const renderPromptOptions = (items) => {
    const options = items.map((item, index) => ({
      label: (
        <div
          key={item.value}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          title={`${item.value}`}
        >
          <div
            style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}
          >
            <div
              style={{ fontWeight: 500, fontSize: "14px" }}
            >{`${item.label}`}</div>
            <div
              style={{
                fontSize: 12,
                color: "#999",
                whiteSpace: "wrap",
                marginTop: "2px",
              }}
            >
              {`${item.value}`}
            </div>
            {item?.shortcut && (
              <div
                style={{
                  fontSize: 11,
                  color: "#1890ff",
                  whiteSpace: "wrap",
                  marginTop: "2px",
                }}
              >
                <Tag size="small" color="blue">{formatShortcutDisplay(item.shortcut)}</Tag>
              </div>
            )}
          </div>
          <div style={{ marginLeft: "8px", display: "flex", gap: "4px" }}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: "#1890ff" }} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEditPromptClick(item);
              }}
              title="Edit prompt"
            />
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                const newPromptList = items.filter(
                  (i) => i.value !== item.value,
                );
                setPromptList(newPromptList);
                syncShortcutListToBackend(newPromptList, systemShortcuts);
                messageApi.open({
                  type: "success",
                  content: "Prompt deleted successfully",
                });
              }}
              title="Delete prompt"
            />
          </div>
        </div>
      ),
      value: item.value,
      name: item.value,
    }));
    return options;
  };

  const renderMessage = (message) => (
    <ChatMessageItem
      key={message.id}
      message={message}
      isEditing={editingMessageId === message.id}
      editingContent={editingContent}
      onEditingContentChange={setEditingContent}
      onSaveEdit={handleSaveEdit}
      onCancelEdit={handleCancelEdit}
      onEditMessage={handleEditMessage}
      onRegenerateResponse={handleRegenerateResponse}
    />
  );

  return (
    <div>
      {contextHolder}
      <Spin spinning={isLoading}>
        <div
          style={{
            height: "calc(100vh - 46px)",
            display: "flex",
            flexDirection: "column",
            paddingTop: "12px",
            paddingBottom: "12px",
            gap: "8px",
            position: "relative",
          }}
        >
          {/* Chat Messages - 撑满剩余高度 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
            }}
          >
            <Card
              size="small"
              title={
                <Title
                  level={4}
                  style={{
                    margin: 0,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Chat</span>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {chatMessages.length > 0 && (
                      <Tooltip title={newChatText}>
                        <Button
                          type="text"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            newChatHandler(chatMessages, chatHistoryList);
                          }}
                        />
                      </Tooltip>
                    )}

                    {/* 保存聊天记录 */}
                    {chatMessages.length > 0 && (
                      <Tooltip title={saveChatText}>
                        <Button
                          type="text"
                          size="small"
                          icon={<SaveOutlined />}
                          onClick={() => {
                            saveChatHistory(chatMessages, chatHistoryList);
                          }}
                        />
                      </Tooltip>
                    )}
                    {/* 删除聊天记录 */}
                    {chatMessages.length > 0 && (
                      <Tooltip placement="left" title={clearChatText}>
                        <Button
                          danger
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={clearChat}
                        />
                      </Tooltip>
                    )}
                  </div>
                </Title>
              }
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
              headStyle={{
                top: 0,
                position: "sticky",
                background: "white",
                zIndex: 1000,
              }}
              bodyStyle={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "12px",
                overflowY: "auto",
                height: "100px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "16px",
                  // backgroundColor: "#fafafa",
                  borderRadius: "8px",
                  minHeight: 0,
                }}
              >
                {chatMessages.length === 0 ? (
                  <div>
                    <div
                      style={{
                        opacity: 0.6,
                        textAlign: "center",
                      }}
                    >
                      <Text style={{ color: "#999", fontSize: "14px" }}>
                        Shortcuts reference
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        padding: "20px 20px",
                        textAlign: "center",
                        overflow: "auto",
                        gap: "4px",
                      }}
                    >
                      {[...systemShortcuts, ...promptList]
                        .filter(
                          (shortcut) =>
                            shortcut?.label && shortcut?.value,
                        )
                        .map((shortcut, index) => (
                          <Card
                            key={shortcut.key || shortcut.value}
                            size="small"
                            style={{
                              border: "1px solid #f0f0f0",
                              borderRadius: "8px",
                              transition: "all 0.3s ease",
                              width: "100%",
                              backgroundColor: "transparent",
                            }}
                            bodyStyle={{
                              display: "flex",
                              flexDirection: "column",
                              padding: "6px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                              }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  fontSize: "12px",
                                  color: "#666",
                                }}
                              >
                                {shortcut.label}
                              </div>
                              {shortcut.shortcut ? (
                                <Tag
                                  color={TAG_COLORS[index % TAG_COLORS.length]}
                                  style={{
                                    fontSize: "12px",
                                    borderRadius: "4px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {formatShortcutDisplay(shortcut.shortcut)}
                                </Tag>
                              ) : (
                                <Tag style={{ fontSize: "12px", flexShrink: 0, color: "#999" }}>
                                  Set in Settings
                                </Tag>
                              )}
                            </div>
                          </Card>
                        ))}
                    </div>
                    <div style={{ textAlign: "center", marginTop: "16px" }}>
                      <Text style={{ fontSize: "14px" }}>
                        Start a conversation by typing a message below...
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div>
                    {chatMessages.map(renderMessage)}
                    {isAskLoading && (
                      <div
                        style={{
                          display: "flex",
                          marginBottom: "16px",
                          justifyContent: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                          }}
                        >
                          <Avatar
                            icon={<RobotOutlined />}
                            style={{
                              backgroundColor: "#1890ff",
                              marginTop: "4px",
                            }}
                            size="small"
                          />
                          <div
                            style={{
                              backgroundColor: "#f5f5f5",
                              padding: "12px 16px",
                              borderRadius: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <Spin size="small" />
                            <Text>Thinking...</Text>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Prompt Area - 可切换显示 */}
          {showPromptArea && (
            <Card size="small" title={null}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Text strong style={{ minWidth: "55px" }}>
                  Prompt:
                </Text>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select a prompt template"
                  onSelect={onSelectPromptHandler}
                  options={renderPromptOptions(promptList)}
                  value={selectedPrompt}
                  showSearch
                  filterOption={(input, option) => {
                    // 匹配 label 和 value
                    const label =
                      option.label?.props?.children?.[0]?.props?.children?.[0]
                        ?.props?.children || "";
                    const value = option.value || "";
                    return (
                      label.toLowerCase().includes(input.toLowerCase()) ||
                      value.toLowerCase().includes(input.toLowerCase())
                    );
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginTop: "12px",
                  overflowX: "auto",
                }}
                className="recent-prompts"
              >
                {recentPrompts?.map((prompt, index) => (
                  <div
                    key={prompt?.value}
                    onClick={(e) => {
                      onSelectPromptHandler(prompt?.value);
                    }}
                    className="recent-prompt-item"
                    title={prompt?.value}
                  >
                    <Tag
                      key={prompt?.label}
                      closable
                      onClose={(e) => {
                        e.stopPropagation();
                        setRecentPrompts(
                          recentPrompts.filter((_, i) => i !== index),
                        );
                      }}
                      color={TAG_COLORS[index % TAG_COLORS.length]}
                      style={{
                        maxWidth: "200px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {prompt?.label || prompt?.value}
                      </div>
                    </Tag>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Input Area - 固定在底部 */}
          <Card
            size="small"
            title={null}
            style={{
              position: "sticky",
              bottom: 0,
              backgroundColor: "#fff",
              borderTop: "1px solid #f0f0f0",
              zIndex: 10,

              overflow: "hidden",
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ flex: 1 }}>
                  <TextArea
                    ref={inputRef}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder={sendPlaceholderText}
                    value={selection}
                    onChange={onChangeSelectionHandler}
                    allowClear
                    style={{ fontSize: "14px" }}
                    onPressEnter={(e) => {
                      const isCmdOrCtrl = window.config_.isMac
                        ? e.metaKey
                        : e.ctrlKey;
                      if (isCmdOrCtrl && e.shiftKey) {
                        e.preventDefault();
                        newChatHandler(chatMessages, chatHistoryList);
                        setTimeout(() => {
                          askRef.current?.click();
                        }, 200);
                      } else if (isCmdOrCtrl) {
                        e.preventDefault();
                        askRef.current?.click();
                      } else if (e.shiftKey) {
                        e.preventDefault();
                        newChatHandler(chatMessages, chatHistoryList);
                        setTimeout(() => {
                          askRef.current?.click();
                        }, 200);
                      }
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Tooltip title="Cmd+Enter to send OR Shift+Enter to send new chat">
                  <Button
                    disabled={selection.trim() === ""}
                    title="Cmd+Enter to send"
                    ref={askRef}
                    type="primary"
                    loading={isAskLoading}
                    icon={<SendOutlined />}
                    onClick={() => {
                      handleChat(selection, false);
                      setSelection("");
                    }}
                    style={{ minWidth: "100px" }}
                  >
                    {isAskLoading ? "Sending..." : "Send"}
                  </Button>
                </Tooltip>

                {isAskLoading && (
                  <Tooltip title="Stop Request">
                    <Button
                      danger
                      icon={<StopOutlined />}
                      onClick={stopRequest}
                      style={{ marginLeft: "8px" }}
                    ></Button>
                  </Tooltip>
                )}

                <Tooltip title="Toggle Prompt" placement="bottomLeft">
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                    onClick={() => {
                      setShowPromptArea(!showPromptArea);
                    }}
                    title={
                      showPromptArea
                        ? "Hide Prompt Settings"
                        : "Show Prompt Settings"
                    }
                  />
                </Tooltip>
              </div>
            </Space>
          </Card>
        </div>

        <Modal
          title="Edit Prompt"
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText="Update"
          cancelText="Cancel"
          destroyOnClose
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleModalOk}>
            <Form.Item
              name="title"
              label="Prompt Title"
              rules={[
                {
                  required: true,
                  message: "Please enter prompt title",
                },
              ]}
            >
              <Input placeholder="Enter a descriptive title for this prompt" />
            </Form.Item>
            <Form.Item
              name="prompt"
              label="Prompt Template"
              rules={[
                {
                  required: true,
                  message: "Please enter prompt",
                },
              ]}
            >
              <TextArea
                placeholder="Enter your prompt template. Use {text} as placeholder for the input text."
                autoSize={{ minRows: 4, maxRows: 8 }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Spin>
    </div>
  );
};

export default ChatComp;
