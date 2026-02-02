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
import { useEffect, useRef, useState } from "react";
import { TAG_COLORS } from "../../constant";
import "./index.css";
import { useAppStore } from "../../store";
import { useShortcutLabels } from "../../hooks/useShortcutLabels";
import { useChatMessages } from "./hooks/useChatMessages";
import { useChatShortcuts } from "./hooks/useChatShortcuts";
import { useChatSession } from "./hooks/useChatSession";
import { useMessageEditing } from "./hooks/useMessageEditing";
import { usePromptModal } from "./hooks/usePromptModal";
import { usePromptSelection } from "./hooks/usePromptSelection";
import { useSelectionHandler } from "./hooks/useSelectionHandler";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { getPromptSelectOptions } from "../../utils/getPromptSelectOptions";
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
  const [isLoading, setIsLoading] = useState(false);

  const askRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { handleChat, isAskLoading, stopRequest } = useChatMessages(
    chatMessages,
    setChatMessages,
    messageApi,
  );

  const { saveChatHistory, newChatHandler, clearChat } = useChatSession({
    chatMessages,
    setChatMessages,
    setChatHistoryList,
    isAskLoading,
    messageApi,
  });

  const {
    editingMessageId,
    editingContent,
    setEditingContent,
    handleCancelEdit,
    handleEditMessage,
    handleSaveEdit,
    handleRegenerateResponse,
    handleChatWithEdit,
  } = useMessageEditing({
    chatMessages,
    messageApi,
    handleChat,
    isAskLoading,
  });

  const {
    isModalVisible,
    form,
    handleModalCancel,
    handleModalOk,
  } = usePromptModal(promptList, setPromptList, systemShortcuts, messageApi);

  const shortcutLabels = useShortcutLabels(isMac);
  const {
    selection,
    setSelection,
    onSelectPromptHandler,
    onChangeSelectionHandler,
  } = usePromptSelection({
    promptList,
    selectedPrompt,
    setSelectedPrompt,
  });

  useSelectionHandler({
    isMac,
    setActiveKey,
    messageApi,
    selectedPrompt,
    setSelectedPrompt,
    newChatHandler,
    chatMessages,
    chatHistoryList,
    handleChatWithEdit,
    setSelection,
    setIsLoading,
    inputRef,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

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

  const promptSelectOptions = getPromptSelectOptions(promptList, {
    formatShortcut: formatShortcutDisplay,
  });

  return (
    <div>
      {contextHolder}
      <Spin spinning={isLoading}>
        <div className="chat-comp-root">
          <div className="chat-comp-body">
            <Card
              size="small"
              className="chat-comp-card"
              title={
                <Title level={4} className="chat-comp-card-title">
                  <span>Chat</span>
                  <div className="chat-comp-card-actions">
                    {chatMessages.length > 0 && (
                      <Tooltip title={shortcutLabels.newChatText}>
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
                      <Tooltip title={shortcutLabels.saveChatText}>
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
                      <Tooltip placement="left" title={shortcutLabels.clearChatText}>
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
            >
              <div className="chat-comp-card-body-inner">
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
              <div className="prompt-area-row">
                <Text strong className="prompt-area-label">
                  Prompt:
                </Text>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select a prompt template"
                  onSelect={onSelectPromptHandler}
                  options={promptSelectOptions}
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
              <div className="recent-prompts recent-prompts-row">
                {recentPrompts?.map((prompt, index) => (
                  <div
                    key={prompt?.value}
                    onClick={() => onSelectPromptHandler(prompt?.value)}
                    className="recent-prompt-item recent-prompt-tag"
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
                    >
                      <span className="recent-prompt-tag-inner">
                        {prompt?.label || prompt?.value}
                      </span>
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
            sendPlaceholderText={shortcutLabels.sendPlaceholderText}
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
