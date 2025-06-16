import NavBar from "./components/NavBar";
import {
  Button,
  FloatButton,
  Layout,
  message,
  Select,
  Input,
  Flex,
} from "antd";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { EventsOn, EventsOff } from "../wailsjs/runtime/runtime";
import Tesseract from "tesseract.js";
import { ChatAPI } from "../wailsjs/go/main/App";
const { TextArea } = Input;

const { Content } = Layout;

const defaultORCLang = ["chi_sim"];
const defaultPrompt = "翻译成中文";

const App = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const [screenshot, setScreenshot] = useState(null);
  const [selection, setSelection] = useState(null);
  const [ORCLang, setORCLang] = useState(defaultORCLang);
  const [chatResponse, setChatResponse] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(defaultPrompt);
  const [isLoading, setIsLoading] = useState(false);

  const ORCLangOptions = [
    { value: "chi_sim", label: "简体中文" },
    { value: "eng", label: "英文" },
  ];

  const promptOptions = [
    { value: "翻译成中文", label: "翻译成中文" },
    { value: "翻译成英文", label: "翻译成英文" },
  ];

  const handleChat = async (message) => {
    setChatResponse(null);
    setIsLoading(true);
    console.log("message", message);
    const response = await ChatAPI(message);
    setIsLoading(false);
    console.log("response", response);
    if (response.code === 200) {
      setChatResponse(response.data);
    } else {
      messageApi.open({
        type: "error",
        content: response.data,
      });
    }
  };

  const onChangeLangHandler = (value) => {
    console.log("value", value);
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
    if (text.length === 0) {
      return;
    }
    setSelection(text);
    handleChat(messageGenerator(selectedPrompt, text));
  };

  const onScreenshotHandler = async (event) => {
    console.log("ORCLang", ORCLang);
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
    console.log("event", event.target.value);
    setSelection(event.target.value);
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

  return (
    <>
      {contextHolder}
      <Layout
        style={{
          minHeight: "100vh",
        }}
      >
        {isLoading && <div>Loading...</div>}
        {/* {selection && <h1>selection:{selection}</h1>} */}
        {chatResponse && <h2>chatResponse:{chatResponse}</h2>}
        <div>
          ORC 识别语言:
          <Select
            mode="multiple"
            style={{ width: 200, marginBottom: 16 }}
            options={ORCLangOptions}
            value={ORCLang}
            onChange={onChangeLangHandler}
            placeholder="选择识别语言"
          />
        </div>
        <div>
          提示词:
          <Select
            style={{ width: 200, marginBottom: 16 }}
            options={promptOptions}
            value={selectedPrompt}
            onChange={onChangePromptHandler}
            placeholder="选择提示词"
          />
        </div>

        <TextArea
          autoSize
          placeholder="maxLength is 6"
          value={selection}
          onChange={onChangeSelectionHandler}
        />
        <Flex style={{ marginTop: 16 }} justify="flex-end" align="center">
          <Button type="primary">Ask</Button>
        </Flex>

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
