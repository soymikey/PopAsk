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
} from "antd";
const { Panel } = Collapse;
import {
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useRef } from "react";
import {
  EventsOn,
  EventsOff,
  WindowShow,
} from "../../../wailsjs/runtime/runtime";
import Tesseract from "tesseract.js";
import { ChatAPI } from "../../../wailsjs/go/main/App";
import {
  IS_OPEN_RECENT_PROMPTS_KEY,
  DEFAULT_PROMPT_OPTIONS,
  TAG_COLORS,
  IS_OPEN_RECENT_PROMPTS_VALUE,
} from "../../data/language";
import {
  messageGenerator,
  newPromptGenerator,
  languageFormate,
  getLocalStorage,
} from "../../utils";
import useLocalStorage from "../../hooks/useLocalStorage";
import "./index.css";
import {
  DEFAULT_ORC_LANG,
  RECENT_PROMPTS_KEY,
  PROMPT_LIST_KEY,
  SELECTED_PROMPT_KEY,
  ORC_LANG_KEY,
} from "../../constant";
import { MarkDownComp } from "../MarkDownComp";
const { TextArea } = Input;
const { Title, Text } = Typography;

const AskComp = ({ setActiveKey }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const [screenshot, setScreenshot] = useState(null);
  const [selection, setSelection] = useState("");
  const [chatResponse, setChatResponse] = useState(null);
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

  const [promptList, setPromptList] = useLocalStorage(
    PROMPT_LIST_KEY,
    DEFAULT_PROMPT_OPTIONS
  );

  const [recentPromptsActiveKey, setRecentPromptsActiveKey] = useLocalStorage(
    IS_OPEN_RECENT_PROMPTS_KEY,
    IS_OPEN_RECENT_PROMPTS_VALUE
  );
  const [newPrompt, setNewPrompt] = useState("");
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const onNewPromptChange = (event) => {
    setNewPrompt(event.target.value);
  };

  const onNewPromptTitleChange = (event) => {
    setNewPromptTitle(event.target.value);
  };

  const addPrompt = (e) => {
    e.preventDefault();
    const newPrompt_ = newPromptGenerator(newPromptTitle, newPrompt);
    if (!newPrompt_) {
      messageApi.open({
        type: "error",
        content: "Please enter prompt title and prompt",
      });
      return;
    }
    setPromptList([...promptList, newPrompt_]);

    setNewPrompt("");
    setNewPromptTitle("");
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
    setNewPrompt("");
    setNewPromptTitle("");
    form.resetFields();
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      setNewPromptTitle(values.title);
      setNewPrompt(values.prompt);
      addPrompt({ preventDefault: () => {} });
    });
  };

  const handleChat = async (message) => {
    setChatResponse(null);
    setIsAskLoading(true);
    console.log("message", message);
    const response = await ChatAPI(message);
    setIsAskLoading(false);
    console.log("response", response);
    if (response.code === 200) {
      setChatResponse(response.data);
      const prompt = promptList.find((p) => p.value === selectedPrompt);
      if (!prompt) return;
      setRecentPrompts((prev) => {
        const filteredPrompts = prev.filter((p) => p.label !== prompt.label);
        const newPrompts = [prompt, ...filteredPrompts];
        return newPrompts.slice(0, 12);
      });
    } else {
      messageApi.open({
        type: "error",
        content: response.data,
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
      setActiveKey("ask");

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

      setSelectedPrompt(prompt_);

      setSelection(messageGenerator(prompt_, text));
      setChatResponse(null);
      if (autoAsking) {
        handleChat(messageGenerator(prompt_, text));
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
    // cmd+enter 的是 触发点击按钮
    window.addEventListener("keydown", (e) => {
      if (e.metaKey && e.key === "Enter") {
        askRef.current?.click();
      }
    });
  }, [askRef]);

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
                setPromptList(items.filter((i) => i.value !== item.value));
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

  useEffect(() => {
    console.log("AskComp");
  }, []);

  return (
    <div style={{ paddingTop: "12px", paddingBottom: "12px" }}>
      {contextHolder}
      <Spin spinning={isLoading}>
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          {/* Prompt Selection */}
          <Card size="small" title={null}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Text strong style={{ minWidth: "80px" }}>
                Prompt:
              </Text>
              <Select
                style={{ flex: 1 }}
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
            <Collapse
              accordion
              bordered={false}
              size="small"
              style={{ marginTop: "12px" }}
              activeKey={recentPromptsActiveKey}
              onChange={(key) => {
                setRecentPromptsActiveKey(
                  key === IS_OPEN_RECENT_PROMPTS_VALUE
                    ? IS_OPEN_RECENT_PROMPTS_VALUE
                    : ""
                );
              }}
            >
              <Panel header="Recent Prompts" key={IS_OPEN_RECENT_PROMPTS_VALUE}>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
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
              </Panel>
            </Collapse>
          </Card>

          {/* Input Area */}
          <Card
            size="small"
            title={
              <Title level={4} style={{ margin: 0 }}>
                Ask Question
              </Title>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <TextArea
                autoSize={{ minRows: 4, maxRows: 12 }}
                placeholder="Enter your question or paste text here..."
                value={`${selection}`}
                onChange={onChangeSelectionHandler}
                allowClear
                style={{ fontSize: "14px" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  title="Cmd+Enter to send"
                  ref={askRef}
                  type="primary"
                  loading={isAskLoading}
                  icon={<SendOutlined />}
                  onClick={() => {
                    handleChat(messageGenerator(selectedPrompt, selection));
                  }}
                  style={{ minWidth: "100px" }}
                >
                  {isAskLoading ? "Thinking..." : "Send"}
                </Button>
              </div>
            </Space>
          </Card>

          {/* Response */}
          {chatResponse && (
            <Card
              size="small"
              title={
                <Title level={4} style={{ margin: 0 }}>
                  Response
                </Title>
              }
              style={{ borderColor: "#d9d9d9" }}
            >
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                <MarkDownComp>{chatResponse}</MarkDownComp>
              </div>
            </Card>
          )}
        </Space>

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

export default AskComp;
