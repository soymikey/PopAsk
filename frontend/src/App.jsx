import NavBar from "./components/NavBar";
import {
  Button,
  FloatButton,
  Layout,
  message,
  Select,
  Input,
  Spin,
  TreeSelect,
  Tag,
  Tooltip,
} from "antd";
import { Outlet } from "react-router-dom";
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
const { TextArea } = Input;

const { Content } = Layout;

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
  const [recentPrompts, setRecentPrompts] = useState([]);
  const askRef = useRef(null);

  const handleChat = async (message) => {
    setChatResponse(null);
    setIsLoading(true);
    console.log("message", message);
    const response = await ChatAPI(message);
    setIsLoading(false);
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

  const onChangePromptHandler = (value) => {
    setSelectedPrompt(value);
  };

  const messageGenerator = (prompt, text) => {
    return `
    ${prompt}
    ${text}
    `;
  };
  const onSelectionHandler = async (text) => {
    WindowShow();

    if (text.length === 0) {
      return;
    }
    setSelection(text);
    setChatResponse(null);
    // handleChat(messageGenerator(selectedPrompt, text));
  };

  const onScreenshotHandler = async (event) => {
    const lang = ORCLang.length > 1 ? ORCLang.join("+") : ORCLang[0];
    const result = await Tesseract.recognize(event, lang);
    // 去除中文,日文,韩文之间的空格
    const formatResult = result.data.text.replace(
      /(?<=[\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF])\s+(?=[\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF])/g,
      ""
    );
    onSelectionHandler(formatResult);
  };

  const onChangeSelectionHandler = (event) => {
    if (event.target.value.length > selectedPrompt.length) {
      const value = event.target.value.replace(`${selectedPrompt}`, "");
      setSelection(value);
    } else {
      setSelection("");
    }
  };

  useEffect(() => {
    EventsOn("GET_SELECTION", (event) => {
      console.log("GET_SELECTION event:", event);
      onSelectionHandler(event);
    });
    EventsOn("CREATE_SCREENSHOT", async (event) => {
      console.log("CREATE_SCREENSHOT event:", event);
      onScreenshotHandler(event);
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
    if (recentPrompts) {
      setRecentPrompts(JSON.parse(recentPrompts));
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

  return (
    <>
      {contextHolder}
      <Layout
        style={{
          padding: 8,
          minHeight: "100vh",
        }}
      >
        {/* {selection && <h1>selection:{selection}</h1>}
          {chatResponse && <h2>chatResponse:{chatResponse}</h2>} */}
        <div className="setting-container">
          <div style={{ display: "flex", alignItems: "center" }}>
            <span>Prompts:</span>
            {/* <Select
            style={{ width: 200,  }}
            options={promptOptions}
            value={selectedPrompt}
            onChange={onChangePromptHandler}
            placeholder="选择提示词"
          /> */}
            <TreeSelect
              showSearch
              value={selectedPrompt}
              style={{ width: 300 }}
              styles={{
                popup: { root: { maxHeight: 400, overflow: "auto" } },
              }}
              placeholder="Please select"
              treeDefaultExpandAll
              onChange={onChangePromptHandler}
              treeData={PROMPT_OPTIONS}
              onPopupScroll={() => {}}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="Cmd+Shift+O" placement="right">
              <span>ORC:</span>
            </Tooltip>

            <Select
              mode="multiple"
              style={{ width: 300 }}
              options={OCR_LANGUAGE_OPTIONS}
              value={ORCLang}
              onChange={onChangeLangHandler}
              placeholder="选择识别语言"
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
            {recentPrompts.map((prompt, index) => (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPrompt(prompt);
                }}
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
                >
                  {prompt}
                </Tag>
              </div>
            ))}
          </div>
          <TextArea
            // autoSize
            // minRows={3}
            // maxRows={10}
            autoSize={{ minRows: 3, maxRows: 10 }}
            placeholder="Quickly input your question"
            value={`${selectedPrompt}${selection}`}
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
              loading={isLoading}
              onClick={() => {
                handleChat(messageGenerator(selectedPrompt, selection));
              }}
            >
              {isLoading ? "Thinking..." : "Ask"}
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
    </>
  );
};

export default App;
