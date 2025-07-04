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
const { Panel } = Collapse;
import {
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useRef } from "react";
import {
  EventsOn,
  EventsOff,
  WindowShow,
} from "../../../wailsjs/runtime/runtime";
import Tesseract from "tesseract.js";
import { ChatAPI, ChatAPIV2 } from "../../../wailsjs/go/main/App";
import { DEFAULT_PROMPT_OPTIONS, TAG_COLORS } from "../../data/language";
import {
  messageGenerator,
  newPromptGenerator,
  languageFormate,
  getLocalStorage,
  historyGenerator,
  userMessageGenerator,
  assistantMessageGenerator,
} from "../../utils";
import useLocalStorage from "../../hooks/useLocalStorage";
import "./index.css";
import {
  DEFAULT_ORC_LANG,
  RECENT_PROMPTS_KEY,
  SELECTED_PROMPT_KEY,
  ORC_LANG_KEY,
  IS_SHOW_PROMPT_AREA_KEY,
  IS_SHOW_PROMPT_AREA_VALUE,
} from "../../constant";
import { MarkDownComp } from "../MarkDownComp";
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
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const [selection, setSelection] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useLocalStorage(
    SELECTED_PROMPT_KEY,
    DEFAULT_PROMPT_OPTIONS[0].value
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isAskLoading, setIsAskLoading] = useState(false);

  const [recentPrompts, setRecentPrompts] = useLocalStorage(
    RECENT_PROMPTS_KEY,
    []
  );
  const askRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPromptArea, setShowPromptArea] = useLocalStorage(
    IS_SHOW_PROMPT_AREA_KEY,
    IS_SHOW_PROMPT_AREA_VALUE
  );

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

  const handleChat = async (messages) => {
    if (!messages.trim()) {
      messageApi.open({
        type: "warning",
        content: "Please enter a message",
      });
      return;
    }

    // Add user message to chat
    const newChatMessages = [...chatMessages, userMessageGenerator(messages)];
    setChatMessages(newChatMessages);
    setIsAskLoading(true);

    try {
      const params = newChatMessages.map((message) => ({
        role: message.type,
        content: message.content,
      }));
      const response = await ChatAPIV2(JSON.stringify(params));
      setIsAskLoading(false);
      if (response.code === 200) {
        // Add assistant message to chat
        const assistantMessage = assistantMessageGenerator(response.data);
        setChatMessages((prev) => [...prev, assistantMessage]);

        // // Update history
        // setHistoryList([
        //   historyGenerator(messages, response.data),
        //   ...historyList,
        // ]);

        // Update recent prompts
        const prompt = promptList.find((p) => p.value === selectedPrompt);
        if (prompt) {
          setRecentPrompts((prev) => {
            const filteredPrompts = prev.filter(
              (p) => p.label !== prompt.label
            );
            const newPrompts = [prompt, ...filteredPrompts];
            return newPrompts.slice(0, 12);
          });
        }
      } else {
        messageApi.open({
          type: "error",
          content: response.data,
        });
      }
    } catch (error) {
      setIsAskLoading(false);
      messageApi.open({
        type: "error",
        content: error?.message || "Failed to get response",
      });
    }
  };

  const onSelectionHandler = async (selection) => {
    try {
      const {
        text: selectionText,
        shortcut,
        prompt,
        autoAsking,
        isOCR,
        isOpenWindow,
      } = selection;
      console.log("selection", selection);
      let text = selectionText;
      WindowShow();
      setActiveKey("chat");

      setIsLoading(true);
      if (isOCR) {
        const ORCLang = getLocalStorage(ORC_LANG_KEY, DEFAULT_ORC_LANG);
        const lang = ORCLang.length > 1 ? ORCLang.join("+") : ORCLang[0];
        const result = await Tesseract.recognize(text, lang);
        text = languageFormate(result?.data?.text || "");
      }
      if (text.length === 0) {
        return;
      }
      let prompt_ = prompt;
      if (isOpenWindow || isOCR) {
        prompt_ = selectedPrompt;
      }
      newChatHandler;
      setSelectedPrompt(prompt_);
      const formattedMessage = messageGenerator(prompt_, text);
      setSelection(formattedMessage);

      if (autoAsking) {
        setSelection("");
        handleChat(formattedMessage);
      }
    } catch (error) {
      console.log("error", error);
      messageApi.open({
        type: "error",
        content: error?.message || "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectPromptHandler = (value) => {
    setSelectedPrompt(value);
  };

  const onChangeSelectionHandler = (event) => {
    if (event.target.value.length < selectedPrompt.length - 1) {
      setSelectedPrompt("");
    }
    setSelection(event.target.value);
  };
  const newChatHandler = () => {
    setChatHistoryList([...chatHistoryList, chatMessages]);
    setChatMessages([]);
  };

  const clearChat = () => {
    setChatMessages([]);
    messageApi.open({
      type: "success",
      content: "Chat cleared",
    });
  };

  useEffect(() => {
    EventsOn("GET_SELECTION", (event) => {
      console.log("GET_SELECTION event:", event);
      onSelectionHandler(event);
    });

    return () => {
      EventsOff("GET_SELECTION");
    };
  }, [selectedPrompt]);

  useEffect(() => {
    if (selectedPrompt.length === 0) {
      return;
    }
    for (const prompt of promptList) {
      if (selection.startsWith(prompt.value)) {
        const newSelection = selection.slice(prompt.value.length);
        setSelection(messageGenerator(selectedPrompt, newSelection));
        return;
      }
    }
    setSelection(messageGenerator(selectedPrompt, selection));
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
              icon={<DeleteOutlined />}
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
            }}
          >
            <div style={{ marginBottom: "4px" }}>
              <Text
                style={{
                  fontSize: "12px",
                  color: isUser ? "rgba(255,255,255,0.8)" : "#999",
                }}
              >
                {message.timestamp}
              </Text>
            </div>
            {isUser ? (
              <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
            ) : (
              <MarkDownComp>{message.content}</MarkDownComp>
            )}
          </div>
          {isUser && (
            <Avatar
              icon={<UserOutlined />}
              style={{ backgroundColor: "#52c41a", marginTop: "4px" }}
              size="small"
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
                  <div style={{ display: "flex", gap: "8px" }}>
                    {chatMessages.length > 0 && (
                      <Button type="default" onClick={newChatHandler}>
                        New Chat
                      </Button>
                    )}
                    {chatMessages.length > 0 && (
                      <Button danger onClick={clearChat}>
                        Clear Chat
                      </Button>
                    )}
                  </div>
                </Title>
              }
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
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
                  overflowY: "auto",
                  padding: "16px",
                  backgroundColor: "#fafafa",
                  borderRadius: "8px",
                  minHeight: 0,
                }}
              >
                {chatMessages.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                      color: "#999",
                      fontSize: "16px",
                    }}
                  >
                    Start a conversation by typing a message below...
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
                  filterOption={(input, option) =>
                    option.label.props.children[0].props.children[0].props.children
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
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
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="Type your message here... (Cmd+Enter to send)"
                    value={selection}
                    onChange={onChangeSelectionHandler}
                    allowClear
                    style={{ fontSize: "14px" }}
                    onPressEnter={(e) => {
                      if (e.metaKey) {
                        e.preventDefault();
                        askRef.current?.click();
                      }
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  title="Cmd+Enter to send"
                  ref={askRef}
                  type="primary"
                  loading={isAskLoading}
                  icon={<SendOutlined />}
                  onClick={() => {
                    handleChat(selection);
                    setSelection("");
                  }}
                  style={{ minWidth: "100px" }}
                >
                  {isAskLoading ? "Sending..." : "Send"}
                </Button>
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
