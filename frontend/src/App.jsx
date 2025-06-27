import NavBar from "./components/NavBar";
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
  WindowHide,
  WindowShow,
  WindowUnminimise,
  WindowMinimise,
} from "../wailsjs/runtime/runtime";
import Tesseract from "tesseract.js";
import { ChatAPI } from "../wailsjs/go/main/App";
import {
  OCR_LANGUAGE_OPTIONS,
  PROMPT_OPTIONS,
  TAG_COLORS,
} from "./data/language";
import { messageGenerator, breadLine, languageFormate } from "./utils";
import "./app.css";
const { TextArea } = Input;

const defaultORCLang = ["eng"];
const defaultPrompt = "帮我翻译成中文:\n";
const RECENT_PROMPTS_KEY = "recentPrompts";
const App = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const [screenshot, setScreenshot] = useState(null);
  const [selection, setSelection] = useState("");
  const [ORCLang, setORCLang] = useState(defaultORCLang);
  const [chatResponse, setChatResponse] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(defaultPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [isAskLoading, setIsAskLoading] = useState(false);

  const [recentPrompts, setRecentPrompts] = useState([]);
  const askRef = useRef(null);

  const [items, setItems] = useState(PROMPT_OPTIONS);
  const [newPrompt, setNewPrompt] = useState("");
  const inputRef = useRef(null);

  const onNewPromptChange = (event) => {
    setNewPrompt(event.target.value);
  };

  const addPrompt = (e) => {
    e.preventDefault();
    setItems([...items, `${breadLine(newPrompt)}`]);
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
    let text = selection;
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
    setSelection(text);
    setChatResponse(null);
    // handleChat(messageGenerator(selectedPrompt, text));
  };

  const onChangeSelectionHandler = (event) => {
    if (event.target.value.length < selectedPrompt.length - 1) {
      setSelectedPrompt("");
    }

    setSelection(event.target.value);
    // if (event.target.value.length > selectedPrompt.length) {
    //   const value = event.target.value.replace(`${selectedPrompt}`, "");
    //   setSelection(value);
    // } else {
    //   setSelection("");
    // }
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
    const recentPrompts = localStorage.getItem(RECENT_PROMPTS_KEY);
    const parsedRecentPrompts = recentPrompts ? JSON.parse(recentPrompts) : [];
    if (parsedRecentPrompts.length > 0) {
      setRecentPrompts(parsedRecentPrompts);
    } else {
      setRecentPrompts(PROMPT_OPTIONS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(RECENT_PROMPTS_KEY, JSON.stringify(recentPrompts));
  }, [recentPrompts]);

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
    for (const prompt of PROMPT_OPTIONS) {
      if (selection.startsWith(prompt)) {
        const newSelection = selection.slice(prompt.length);
        setSelection(`${value}${newSelection}`);
        return;
      }
    }
    setSelection(`${value}${selection}`);
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{`${item}`}</span>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => {
              setItems(items.filter((i) => i !== item));
            }}
          />
        </div>
      ),
      value: item,
      name: item,
    }));
    return options;
  };

  return (
    <>
      {contextHolder}
      <Spin spinning={isLoading}>
        <Layout
          style={{
            padding: 8,
            minHeight: "100vh",
          }}
        >
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
                style={{ width: 300 }}
                placeholder="Select Prompt"
                dropdownRender={dropdownRenderElement}
                onSelect={onSelectPromptHandler}
                options={renderPromptOptions(items)}
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
        </Layout>
      </Spin>
    </>
  );
};

export default App;
