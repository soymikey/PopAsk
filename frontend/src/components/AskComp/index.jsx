import {
  Button,
  message,
  Select,
  Input,
  Spin,
  Tag,
  Divider,
  Space,
  Modal,
  Form,
  Card,
  Typography,
  Collapse,
} from "antd";
const { Panel } = Collapse;
import { PlusOutlined, DeleteOutlined, SendOutlined } from "@ant-design/icons";
import { useEffect, useState, useRef } from "react";
import { DEFAULT_PROMPT_OPTIONS, TAG_COLORS } from "../../constant";
import { messageGenerator } from "../../utils";
import useLocalStorage from "../../hooks/useLocalStorage";
import { useAppStore } from "../../store";
import { getPromptSelectOptions } from "../../utils/getPromptSelectOptions";
import { useAskChat } from "./hooks/useAskChat";
import { useAddPromptModal } from "./hooks/useAddPromptModal";
import { useAskSelectionHandler } from "./hooks/useAskSelectionHandler";
import "./index.css";
import {
  IS_OPEN_RECENT_PROMPTS_VALUE,
  SELECTED_PROMPT_KEY,
} from "../../constant";
import { MarkDownComp } from "../MarkDownComp";
const { TextArea } = Input;
const { Title, Text } = Typography;

const AskComp = ({
  setActiveKey,
  promptList,
  setPromptList,
  systemShortcuts,
  syncShortcutList,
  historyList,
  setHistoryList,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [selection, setSelection] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useLocalStorage(
    SELECTED_PROMPT_KEY,
    DEFAULT_PROMPT_OPTIONS[0].value
  );
  const [isLoading, setIsLoading] = useState(false);

  const recentPrompts = useAppStore((s) => s.recentPrompts);
  const setRecentPrompts = useAppStore((s) => s.setRecentPrompts);
  const recentPromptsActiveKey = useAppStore((s) => s.recentPromptsActiveKey);
  const setRecentPromptsActiveKey = useAppStore(
    (s) => s.setRecentPromptsActiveKey
  );

  const askRef = useRef(null);

  const { chatResponse, setChatResponse, isAskLoading, handleChat } = useAskChat(
    {
      promptList,
      selectedPrompt,
      historyList,
      setHistoryList,
      messageApi,
    }
  );

  const {
    isModalVisible,
    form,
    handleAddPromptClick,
    handleModalCancel,
    handleModalOk,
  } = useAddPromptModal({
    promptList,
    setPromptList,
    messageApi,
  });

  useAskSelectionHandler({
    setActiveKey,
    selectedPrompt,
    setSelectedPrompt,
    setSelection,
    setChatResponse,
    handleChat,
    messageApi,
    setIsLoading,
  });

  const onSelectPromptHandler = (value) => {
    setSelectedPrompt(value);
  };

  const onChangeSelectionHandler = (event) => {
    const minLen = (selectedPrompt?.length ?? 0) - 1;
    if (minLen >= 0 && event.target.value.length < minLen) {
      setSelectedPrompt("");
    }
    setSelection(event.target.value);
  };

  useEffect(() => {
    if (!selectedPrompt?.length) return;
    for (const prompt of promptList) {
      if (selection.startsWith(prompt.value)) {
        setSelection(
          messageGenerator(selectedPrompt, selection.slice(prompt.value.length))
        );
        return;
      }
    }
    setSelection(messageGenerator(selectedPrompt, selection));
  }, [selectedPrompt]);

  const dropdownRenderElement = (menu) => (
    <>
      {menu}
      <Divider style={{ margin: "8px 0" }} />
      <div className="ask-comp-prompt-dropdown-footer">
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

  const promptSelectOptions = getPromptSelectOptions(promptList, {
    renderExtra: (item, items) => (
      <div style={{ marginLeft: "8px" }}>
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const newPromptList = (items || []).filter(
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
    ),
  });

  return (
    <div style={{ paddingTop: "12px", paddingBottom: "12px" }}>
      {contextHolder}
      <Spin spinning={isLoading}>
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          {/* Prompt Selection */}
          <Card size="small" title={null}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Text strong style={{ minWidth: "55px" }}>
                Prompt:
              </Text>
              <Select
                style={{ minWidth: 350 }}
                placeholder="Select a prompt template"
                dropdownRender={dropdownRenderElement}
                onSelect={onSelectPromptHandler}
                options={promptSelectOptions}
                value={selectedPrompt}
                showSearch
                filterOption={(input, option) =>
                  (option.value || "")
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
                onPressEnter={(e) => {
                  if (e.metaKey) {
                    e.preventDefault();
                    askRef.current?.click();
                  }
                }}
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
