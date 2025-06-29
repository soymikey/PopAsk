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
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

import { useEffect, useState, useRef } from "react";
import {
  EventsOn,
  EventsOff,
  WindowShow,
} from "../../../wailsjs/runtime/runtime";
import Tesseract from "tesseract.js";
import { ChatAPI } from "../../../wailsjs/go/main/App";
import { DEFAULT_PROMPT_OPTIONS, TAG_COLORS } from "../../data/language";
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
const { TextArea } = Input;

const AskComp = ({ setActiveKey }) => {
  const [messageApi, contextHolder] = message.useMessage();

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
  const [newPrompt, setNewPrompt] = useState("");
  const [newPromptTitle, setNewPromptTitle] = useState("");

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
    messageApi.open({
      type: "success",
      content: "Prompt added successfully",
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
            flexDirection: "row",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input
              placeholder="Prompt title"
              value={newPromptTitle}
              onChange={onNewPromptTitleChange}
              onKeyDown={(e) => e.stopPropagation()}
            />
            <Input
              placeholder="Please enter prompt"
              value={newPrompt}
              onChange={onNewPromptChange}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <Button
            size="small"
            type="text"
            icon={<PlusOutlined />}
            onClick={addPrompt}
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
          <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            <div>{`${item.label}`}</div>
            <div style={{ fontSize: 12, color: "#999", whiteSpace: "wrap" }}>
              {`${item.value}`}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#999",
                whiteSpace: "wrap",
                textAlign: "right",
              }}
            >
              {item?.shortcut && <span>{`${item?.shortcut}`}</span>}
            </div>
          </div>
          <div>
            <Button
              type="text"
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
    <div style={{ marginTop: 8 }}>
      {contextHolder}
      <Spin spinning={isLoading}>
        {/* <Button
          type="primary"
          onClick={() => {
            EventsEmit("test", JSON.stringify(promptList));
          }}
        >
          test
        </Button> */}
        {/* {selection && <h1>selection:{selection}</h1>} */}
        {/* {chatResponse && <h2>chatResponse:{chatResponse}</h2>} */}
        <div
          className="setting-container"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span>Prompts:</span>

            <Select
              style={{ width: 350 }}
              placeholder="Select Prompt"
              dropdownRender={dropdownRenderElement}
              onSelect={onSelectPromptHandler}
              options={renderPromptOptions(promptList)}
              value={selectedPrompt}
            />
          </div>
        </div>
        <div className="content-container" style={{ marginTop: 16 }}>
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              gap: 4,
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
                    maxWidth: 134,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {prompt?.label || prompt?.value}
                  </div>
                </Tag>
              </div>
            ))}
          </div>
          <TextArea
            autoSize={{ minRows: 3, maxRows: 10 }}
            placeholder="Quickly input your question"
            value={`${selection}`}
            onChange={onChangeSelectionHandler}
            allowClear
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <Button
              title="cmd+enter"
              ref={askRef}
              type="primary"
              loading={isAskLoading}
              onClick={() => {
                handleChat(messageGenerator(selectedPrompt, selection));
              }}
            >
              {isAskLoading ? "Thinking..." : "Ask"}
            </Button>
          </div>

          {chatResponse && (
            <TextArea
              autoSize={{ minRows: 1, maxRows: 20 }}
              value={chatResponse || ""}
              onChange={() => {}}
              style={{ marginTop: 16 }}
            />
          )}
        </div>

        {/* <NavBar />
        <Layout className="site-layout">
          <Content
            style={{
              background: "white",
              padding: "0 50px",
            }}
          >
            <div
              style={{
                padding: 24,
              }}
            >
              <Outlet />
              <FloatButton.BackTop />
            </div>
          </Content>
        </Layout> */}
      </Spin>
    </div>
  );
};

export default AskComp;
