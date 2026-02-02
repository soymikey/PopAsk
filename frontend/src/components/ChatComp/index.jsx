import {
  Button,
  message,
  Modal,
  Select,
  Input,
  Spin,
  Tag,
  Tooltip,
  Card,
  Typography,
  Form,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  EventsOn,
  EventsOff,
  WindowCenter,
  WindowShow,
  WindowSetAlwaysOnTop,
} from "../../../wailsjs/runtime/runtime";
import { TAG_COLORS } from "../../constant";
import {
  messageGenerator,
  languageFormate,
  getLocalStorage,
  sleep,
  syncShortcutListToBackend,
} from "../../utils";
import "./index.css";
import { useAppStore } from "../../store";
import { DEFAULT_ORC_LANG, ORC_LANG_KEY } from "../../constant";
import { useChatMessages } from "./hooks/useChatMessages";
import { useChatShortcuts } from "./hooks/useChatShortcuts";
import { usePromptModal } from "./hooks/usePromptModal";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import ShortcutCards, { formatShortcutDisplay } from "./ShortcutCards";

const { TextArea } = Input;
const { Title, Text } = Typography;

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
  const isMac = useAppStore((s) => s.platform.isMac);
  const recentPrompts = useAppStore((s) => s.recentPrompts);
  const setRecentPrompts = useAppStore((s) => s.setRecentPrompts);
  const showPromptArea = useAppStore((s) => s.showPromptArea);
  const setShowPromptArea = useAppStore((s) => s.setShowPromptArea);

  const [messageApi, contextHolder] = message.useMessage();
  const [selection, setSelection] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const askRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { handleChat, isAskLoading, stopRequest } = useChatMessages(
    chatMessages,
    setChatMessages,
    messageApi,
  );

  const handleChatWithEdit = useCallback(
    (...args) => {
      setEditingMessageId(null);
      setEditingContent("");
      handleChat(...args);
    },
    [handleChat],
  );

  const {
    isModalVisible,
    isEditMode,
    editingPrompt,
    form,
    handleEditPromptClick,
    handleModalCancel,
    handleModalOk,
  } = usePromptModal(promptList, setPromptList, systemShortcuts, messageApi);

  const newChatText = `New (${isMac ? "Cmd" : "Ctrl"}+N)`;
  const clearChatText = `Clear (${isMac ? "Cmd" : "Ctrl"}+K)`;
  const saveChatText = `Save (${isMac ? "Cmd" : "Ctrl"}+S)`;
  const sendPlaceholderText = `(${
    isMac ? "Cmd" : "Ctrl"
  }+Enter to send) (Shift+Enter to send new chat)`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

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

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent("");
  }, []);

  const handleEditMessage = useCallback((messageId, content) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  }, []);

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
      handleCancelEdit();
      const messageIndex = chatMessages.findIndex(
        (msg) => msg.id === messageId,
      );
      if (messageIndex <= 0) return;
      const prevUserMessage = chatMessages[messageIndex - 1];
      if (!prevUserMessage || prevUserMessage.type !== "user") return;
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

  useChatShortcuts(activeKey, {
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
  });

  const onSelectionHandler = useCallback(
    async (selectionData) => {
      let timeoutId = null;
      try {
        const { shortcut, prompt, autoAsking, isOCR, isOpenWindow } =
          selectionData;
        let text = selectionData?.text || "";
        if (isMac) {
          WindowCenter();
          WindowShow();
        } else {
          WindowCenter();
          WindowSetAlwaysOnTop(true);
          setTimeout(() => WindowSetAlwaysOnTop(false), 1000);
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
          const lang =
            ORCLang?.length > 1
              ? ORCLang.join("+")
              : (ORCLang?.[0] ?? "eng");
          const { default: Tesseract } = await import("tesseract.js");
          const result = await Tesseract.recognize(text, lang);
          text = languageFormate(result?.data?.text || "");
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
        if (text.length === 0) return;
        let prompt_ = prompt;
        if (isOpenWindow || isOCR) {
          prompt_ = selectedPrompt;
        }
        newChatHandler(chatMessages, chatHistoryList);
        setSelectedPrompt(prompt_);
        const formattedMessage = messageGenerator(prompt_, text);
        setSelection(formattedMessage);
        if (autoAsking) {
          setSelection("");
          await handleChatWithEdit(formattedMessage, true);
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
    },
    [
      isMac,
      setActiveKey,
      messageApi,
      selectedPrompt,
      setSelectedPrompt,
      newChatHandler,
      chatMessages,
      chatHistoryList,
      handleChatWithEdit,
    ],
  );

  useEffect(() => {
    EventsOn("GET_SELECTION", onSelectionHandler);
    return () => EventsOff("GET_SELECTION");
  }, [onSelectionHandler]);

  const onSelectPromptHandler = useCallback(
    (value) => {
      setSelectedPrompt(value);
      if (value.length === 0) return;
      for (const prompt of promptList) {
        if (selection.startsWith(prompt.value)) {
          setSelection(
            messageGenerator(value, selection.slice(prompt.value.length)),
          );
          return;
        }
      }
      setSelection(messageGenerator(value, selection));
    },
    [promptList, selection, setSelectedPrompt],
  );

  const onChangeSelectionHandler = useCallback(
    (event) => {
      const minLen = (selectedPrompt?.length ?? 0) - 1;
      if (minLen >= 0 && event.target.value.length < minLen) {
        setSelectedPrompt("");
      }
      setSelection(event.target.value);
    },
    [selectedPrompt, setSelectedPrompt],
  );

  const renderPromptOptions = (items) =>
    items.map((item) => ({
      label: (
        <div
          key={item.value}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          title={item.value}
        >
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}
          >
            <div style={{ fontWeight: 500, fontSize: "14px" }}>
              {item.label}
            </div>
            <div style={{ fontSize: 12, color: "#999", marginTop: "2px" }}>
              {item.value}
            </div>
            {item?.shortcut && (
              <Tag size="small" color="blue">
                {formatShortcutDisplay(item.shortcut)}
              </Tag>
            )}
          </div>
        </div>
      ),
      value: item.value,
      name: item.value,
    }));

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
                          onClick={() =>
                            newChatHandler(chatMessages, chatHistoryList)
                          }
                        />
                      </Tooltip>
                    )}
                    {chatMessages.length > 0 && (
                      <Tooltip title={saveChatText}>
                        <Button
                          type="text"
                          size="small"
                          icon={<SaveOutlined />}
                          onClick={() =>
                            saveChatHistory(chatMessages, chatHistoryList)
                          }
                        />
                      </Tooltip>
                    )}
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
                  borderRadius: "8px",
                  minHeight: 0,
                }}
              >
                {chatMessages.length === 0 ? (
                  <ShortcutCards
                    systemShortcuts={systemShortcuts}
                    promptList={promptList}
                  />
                ) : (
                  <ChatMessageList
                    messages={chatMessages}
                    editingMessageId={editingMessageId}
                    editingContent={editingContent}
                    setEditingContent={setEditingContent}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onEditMessage={handleEditMessage}
                    onRegenerateResponse={handleRegenerateResponse}
                    isAskLoading={isAskLoading}
                    messagesEndRef={messagesEndRef}
                  />
                )}
              </div>
            </Card>
          </div>

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
                    onClick={() => onSelectPromptHandler(prompt?.value)}
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

          <ChatInput
            inputRef={inputRef}
            askRef={askRef}
            selection={selection}
            onSelectionChange={onChangeSelectionHandler}
            sendPlaceholderText={sendPlaceholderText}
            isMac={isMac}
            onSend={() => {
              handleChatWithEdit(selection, false);
              setSelection("");
            }}
            isAskLoading={isAskLoading}
            stopRequest={stopRequest}
            newChatHandler={newChatHandler}
            chatMessages={chatMessages}
            chatHistoryList={chatHistoryList}
            setShowPromptArea={setShowPromptArea}
            showPromptArea={showPromptArea}
          />
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
              rules={[{ required: true, message: "Please enter prompt title" }]}
            >
              <Input placeholder="Enter a descriptive title for this prompt" />
            </Form.Item>
            <Form.Item
              name="prompt"
              label="Prompt Template"
              rules={[{ required: true, message: "Please enter prompt" }]}
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
