import {
  Button,
  Layout,
  message,
  Select,
  Input,
  Spin,
  Tag,
  Tooltip,
  Divider,
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
  UserOutlined,
  RobotOutlined,
  SettingOutlined,
  LinkOutlined,
  SaveOutlined,
  StopOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useRef } from "react";
import {
  EventsOn,
  EventsOff,
  WindowShow,
  WindowSetAlwaysOnTop,
} from "../../../wailsjs/runtime/runtime";
import Tesseract from "tesseract.js";
import {
  AIBianxieAPI,
  ChatAPIV2,
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
} from "../../utils";
import useLocalStorage from "../../hooks/useLocalStorage";
import "./index.css";
import {
  DEFAULT_ORC_LANG,
  RECENT_PROMPTS_KEY,
  ORC_LANG_KEY,
  IS_SHOW_PROMPT_AREA_KEY,
  IS_SHOW_PROMPT_AREA_VALUE,
  DEFAULT_DAILY_LIMIT,
} from "../../constant";
import { MarkDownComp } from "../MarkDownComp";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Title, Text } = Typography;

const ChatComp = ({
  setActiveKey,
  promptList,
  setPromptList,
  systemShortcuts,
  syncShortcutList,
  chatHistoryList,
  setChatHistoryList,
  chatMessages,
  setChatMessages,
  selectedPrompt,
  setSelectedPrompt,
}) => {
  const chatHistoryListRef = useRef(chatHistoryList);
  const chatMessagesRef = useRef(chatMessages);
  const selectedPromptRef = useRef(selectedPrompt);
  const isRequestCancelledRef = useRef(false);

  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const [selection, setSelection] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isAskLoading, setIsAskLoading] = useState(false);

  const [recentPrompts, setRecentPrompts] = useLocalStorage(
    RECENT_PROMPTS_KEY,
    []
  );
  const askRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPromptArea, setShowPromptArea] = useLocalStorage(
    IS_SHOW_PROMPT_AREA_KEY,
    IS_SHOW_PROMPT_AREA_VALUE
  );

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const addPrompt = (newPrompt, newPromptTitle) => {
    const newPrompt_ = newPromptGenerator(newPromptTitle, newPrompt);
    if (!newPrompt_) {
      messageApi.open({
        type: "error",
        content: "Please enter prompt title and prompt",
      });
      return;
    }
    setPromptList([...promptList, newPrompt_]);

    setIsModalVisible(false);
    form.resetFields();
    messageApi.open({
      type: "success",
      content: "Prompt added successfully",
    });
  };

  const handleAddPromptClick = () => {
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      addPrompt(values.prompt, values.title);
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

    // Check daily usage limit
    const usageInfo = checkDailyUsageLimit(DEFAULT_DAILY_LIMIT);
    if (!usageInfo.canUse) {
      messageApi.open({
        type: "warning",
        content: `Daily usage limit reached (${usageInfo.limit} times), please try again tomorrow`,
      });
      return;
    }

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
    console.log("newChatMessages", newChatMessages);
    setChatMessages(newChatMessages);
    setIsAskLoading(true);

    try {
      const params = newChatMessages.map((message) => ({
        role: message.type,
        content: message.content,
      }));
      const response = await AIOpenHubAPI(JSON.stringify(params));

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
          (p) => p.value === selectedPromptRef.current
        );
        if (prompt) {
          setRecentPrompts((prev) => {
            const filteredPrompts = prev.filter(
              (p) => p.label !== prompt.label
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
        WindowShow();
      } else {
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
      console.log("error", error);
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
    // 如果当前的chatMessages 存在历史记录中，则不添加
    if (
      chatHistoryList.length > 0 &&
      chatHistoryList.some((history) =>
        history.every(
          (message, index) => message.content === chatMessages[index].content
        )
      )
    ) {
      setChatMessages([]);

      return;
    }
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
      (msg) => msg.id === editingMessageId
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
      console.log("GET_SELECTION event:", event);
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

  const dropdownRenderElement = (menu) => {
    const customMenuItem = (
      <>
        <Divider style={{ margin: "8px 0" }} />
        <div
          style={{
            padding: "0 8px 4px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddPromptClick}
          >
            Add Prompt
          </Button>
        </div>
      </>
    );
    return (
      <>
        {menu} {customMenuItem}
      </>
    );
  };

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
                <Tag size="small" color="blue">{`${item?.shortcut}`}</Tag>
              </div>
            )}
          </div>
          <div style={{ marginLeft: "8px" }}>
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                const newPromptList = items.filter(
                  (i) => i.value !== item.value
                );
                setPromptList(newPromptList);
                syncShortcutList(newPromptList, systemShortcuts);
                messageApi.open({
                  type: "success",
                  content: "Prompt deleted successfully",
                });
              }}
            />
          </div>
        </div>
      ),
      value: item.value,
      name: item.value,
    }));
    return options;
  };

  const renderMessage = (message) => {
    const isUser = message.type === "user";
    const isEditing = editingMessageId === message.id;

    return (
      <div
        key={message.id}
        style={{
          display: "flex",
          marginBottom: "16px",
          justifyContent: isUser ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            maxWidth: "80%",
            gap: "8px",
          }}
        >
          {!isUser && (
            <Avatar
              icon={<RobotOutlined />}
              style={{
                backgroundColor: "#1890ff",
                marginTop: "4px",
                flexShrink: 0,
                minWidth: "24px",
                minHeight: "24px",
              }}
              size="small"
            />
          )}
          <div
            style={{
              backgroundColor: isUser ? "#1890ff" : "#f5f5f5",
              color: isUser ? "white" : "black",
              padding: "12px 16px",
              borderRadius: "12px",
              maxWidth: "100%",
              wordWrap: "break-word",
              position: "relative",
            }}
            className="message-container"
          >
            <div style={{ marginBottom: "4px" }}>
              <Text
                style={{
                  fontSize: "12px",
                  color: isUser ? "rgba(255,255,255,0.8)" : "#999",
                }}
              >
                {dayjs(message.timestamp).fromNow()}
              </Text>
            </div>

            {isEditing ? (
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  padding: "12px",
                  border: "2px solid #1890ff",
                  marginBottom: "8px",
                  boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)",
                }}
              >
                <TextArea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  autoSize={{ minRows: 2, maxRows: 8 }}
                  style={{
                    backgroundColor: "white",
                    color: "black",
                    marginBottom: "12px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                  placeholder="Edit your message here..."
                  onPressEnter={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    }
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleCancelEdit}
                    style={{ borderRadius: "6px" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={handleSaveEdit}
                    style={{ borderRadius: "6px" }}
                  >
                    Save & Send
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {isUser ? (
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {message.content}
                  </div>
                ) : (
                  <MarkDownComp>{message.content}</MarkDownComp>
                )}

                {/* 操作按钮 - 只在悬停时显示 */}
                <div
                  className="message-actions"
                  style={{
                    display: "flex",
                    gap: "4px",
                    opacity: 0,
                    transition: "opacity 0.2s ease",
                    pointerEvents: "none",
                  }}
                >
                  {isUser && (
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() =>
                        handleEditMessage(message.id, message.content)
                      }
                      style={{
                        color: "#666",
                        padding: "2px 4px",
                        height: "auto",
                        pointerEvents: "auto",
                      }}
                    />
                  )}
                  {!isUser && (
                    <Button
                      type="text"
                      size="small"
                      icon={<SendOutlined />}
                      onClick={() => handleRegenerateResponse(message.id)}
                      style={{
                        color: "#666",
                        padding: "2px 4px",
                        height: "auto",
                        pointerEvents: "auto",
                      }}
                      title="Regenerate response"
                    />
                  )}
                </div>
              </>
            )}
          </div>
          {isUser && (
            <Avatar
              icon={<UserOutlined />}
              size="small"
              style={{
                backgroundColor: "#52c41a",
                marginTop: "4px",
                flexShrink: 0,
                minWidth: "24px",
                minHeight: "24px",
              }}
            />
          )}
        </div>
      </div>
    );
  };

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
                      <Tooltip title="New Chat">
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
                      <Tooltip title="Save">
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
                      <Tooltip title="Delete">
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
                  backgroundColor: "#fafafa",
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
                            shortcut?.shortcut &&
                            shortcut?.label &&
                            shortcut?.value
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
                              {shortcut.shortcut && (
                                <Tag
                                  color={TAG_COLORS[index % TAG_COLORS.length]}
                                  style={{
                                    fontSize: "12px",
                                    borderRadius: "4px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {shortcut.shortcut}
                                </Tag>
                              )}
                            </div>
                          </Card>
                        ))}
                      {/* 
                    <div
                      style={{
                        marginTop: "32px",
                        padding: "16px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                        maxWidth: "600px",
                      }}
                    >
                      <Text style={{ color: "#666", fontSize: "13px" }}>
                        💡 <strong>Tip:</strong> Select any text on your screen
                        and use the shortcuts above to get instant AI
                        assistance. You can also type directly in the input box
                        below.
                      </Text>
                    </div> */}
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
                  dropdownRender={dropdownRenderElement}
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
                          recentPrompts.filter((_, i) => i !== index)
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
                    placeholder="(Cmd+Enter to send) (Shift+Enter to send new chat)"
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
          title="Add New Prompt"
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText="Add"
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
