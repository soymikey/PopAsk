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
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
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
  OCR_LANGUAGE_OPTIONS,
  PROMPT_OPTIONS,
  TAG_COLORS,
} from "../../data/language";
import {
  messageGenerator,
  newPromptGenerator,
  languageFormate,
} from "../../utils";
import useLocalStorage from "../../hooks/useLocalStorage";
import "./index.css";
import {
  DEFAULT_ORC_LANG,
  RECENT_PROMPTS_KEY,
  PROMPT_LIST_KEY,
  SELECTED_PROMPT_KEY,
} from "../../constant";
const { TextArea } = Input;

const App = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const [screenshot, setScreenshot] = useState(null);
  const [selection, setSelection] = useState("");
  const [ORCLang, setORCLang] = useState(DEFAULT_ORC_LANG);
  const [chatResponse, setChatResponse] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useLocalStorage(
    SELECTED_PROMPT_KEY,
    ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isAskLoading, setIsAskLoading] = useState(false);

  const [recentPrompts, setRecentPrompts] = useLocalStorage(
    RECENT_PROMPTS_KEY,
    []
  );
  const askRef = useRef(null);

  const [promptList, setPromptList] = useLocalStorage(PROMPT_LIST_KEY, []);
  const [newPrompt, setNewPrompt] = useState("");
  const inputRef = useRef(null);

  const onNewPromptChange = (event) => {
    setNewPrompt(event.target.value);
  };

  const addPrompt = (e) => {
    e.preventDefault();
    setPromptList([...promptList, `${newPromptGenerator(newPrompt)}`]);
    setNewPrompt("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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
      setRecentPrompts((prev) => {
        const newPrompts = [...new Set([selectedPrompt, ...prev])];
        return newPrompts.slice(0, 12);
      });
    } else {
      messageApi.open({
        type: "error",
        content: response.data,
      });
    }
  };

  const onChangeLangHandler = (value) => {
    if (value.length > 5) {
      messageApi.open({
        type: "error",
        content: "can't select more than 5 languages",
      });
      return;
    }
    setORCLang(value);
  };

  const onSelectionHandler = async (selection, isOCR = false) => {
    const { text: selectionText, shortcut, prompt, autoAsking } = selection;
    console.log("selection", selection);
    let text = selectionText;
    WindowShow();
    setIsLoading(true);
    if (isOCR) {
      const lang = ORCLang.length > 1 ? ORCLang.join("+") : ORCLang[0];
      const result = await Tesseract.recognize(selection, lang);
      text = languageFormate(result?.data?.text || "");
    }
    setIsLoading(false);
    if (text.length === 0) {
      return;
    }
    if (prompt) {
      setSelectedPrompt(prompt);
    }

    setSelection(messageGenerator(prompt, text));
    setChatResponse(null);
    if (autoAsking) {
      handleChat(messageGenerator(prompt, text));
    }
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
    EventsOn("CREATE_SCREENSHOT", async (event) => {
      console.log("CREATE_SCREENSHOT event:", event);
      onSelectionHandler(event, true);
    });
    return () => {
      EventsOff("GET_SELECTION");
      EventsOff("CREATE_SCREENSHOT");
    };
  }, [ORCLang, selectedPrompt]);

  useEffect(() => {
    window.addEventListener("blur", () => {
      // WindowHide();
    });
  }, []);

  useEffect(() => {
    // cmd+enter 的是 触发点击按钮
    window.addEventListener("keydown", (e) => {
      if (e.metaKey && e.key === "Enter") {
        askRef.current.click();
      }
    });
  }, [askRef]);

  const onSelectPromptHandler = (value) => {
    setSelectedPrompt(value);
    for (const prompt of promptList) {
      if (selection.startsWith(prompt.value)) {
        const newSelection = selection.slice(prompt.value.length);
        setSelection(messageGenerator(value, newSelection));

        return;
      }
    }
    setSelection(messageGenerator(value, selection));
  };

  const dropdownRenderElement = (menu) => {
    const customMenuItem = (
      <>
        <Divider style={{ margin: "8px 0" }} />
        <Space style={{ padding: "0 8px 4px" }}>
          <Input
            placeholder="Please enter prompt"
            ref={inputRef}
            value={newPrompt}
            onChange={onNewPromptChange}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <Button
            size="small"
            type="text"
            icon={<PlusOutlined />}
            onClick={addPrompt}
          >
            Add Prompt
          </Button>
        </Space>
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
            {`${item.value}`}
          </div>
          <div>
            <span>{`${item?.shortcut}`}</span>
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

  // useEffect(() => {
  //   setPromptList(PROMPT_OPTIONS);
  // }, []);
  return (
    <>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>ORC:</span>

            <Select
              mode="multiple"
              style={{ width: 300 }}
              options={OCR_LANGUAGE_OPTIONS}
              value={ORCLang}
              onChange={onChangeLangHandler}
              placeholder="选择识别语言"
            />
            {/* 添加一个InfoIcon */}
            <Tooltip
              title={
                <div>
                  <div>Cmd+Shift+O</div>
                  <div>Select a language to OCR</div>
                </div>
              }
              placement="top"
            >
              <InfoCircleOutlined />
            </Tooltip>
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
                key={prompt}
                onClick={(e) => {
                  onSelectPromptHandler(prompt);
                }}
                className="recent-prompt-item"
                title={prompt}
              >
                <Tag
                  key={prompt}
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
                    {prompt}
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
    </>
  );
};

export default App;
