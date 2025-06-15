import NavBar from "./components/NavBar";
import { Button, FloatButton, Layout, message, Select } from "antd";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { EventsOn } from "../wailsjs/runtime/runtime";
import Tesseract from "tesseract.js";
import { ChatAPI } from "../wailsjs/go/main/App";

const { Content } = Layout;

const App = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const [screenshot, setScreenshot] = useState(null);
  const [selection, setSelection] = useState(null);
  const [selectedLang, setSelectedLang] = useState("chi_sim");
  const [chatResponse, setChatResponse] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState("翻译成中文");
  const [isLoading, setIsLoading] = useState(false);

  const languageOptions = [
    { value: "chi_sim", label: "简体中文" },
    { value: "eng", label: "英文" },
  ];

  const promptOptions = [
    { value: "翻译成中文", label: "翻译成中文" },
    { value: "翻译成英文", label: "翻译成英文" },
  ];

  const handleChat = async (message) => {
    console.log("handleChat message:", message);
    setChatResponse(null);
    setIsLoading(true);
    const response = await ChatAPI(message);
    setIsLoading(false);
    if (response.code === 200) {
      setChatResponse(response.data);
    } else {
      messageApi.open({
        type: "error",
        content: response.message,
      });
    }
  };

  const onChangeLangHandler = (value) => {
    // 如果是多个,则拼接
    if (value.length > 1) {
      setSelectedLang(value.join("+"));
    } else {
      setSelectedLang(value[0]);
    }
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
    setSelection(text);
    handleChat(messageGenerator(selectedPrompt, text));
  };

  const onScreenshotHandler = async (event) => {
    const result = await Tesseract.recognize(event, selectedLang);
    // 去除中文,日文,韩文之间的空格
    const formatResult = result.data.text.replace(
      /(?<=[\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF])\s+(?=[\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF])/g,
      ""
    );
    onSelectionHandler(formatResult);
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
  }, []);

  return (
    <>
      {contextHolder}
      <Layout
        style={{
          minHeight: "100vh",
        }}
      >
        {isLoading && <div>Loading...</div>}
        {selection && <h1>selection:{selection}</h1>}
        {chatResponse && <h2>chatResponse:{chatResponse}</h2>}
        <Select
          mode="multiple"
          style={{ width: 200, marginBottom: 16 }}
          options={languageOptions}
          value={selectedLang}
          onChange={onChangeLangHandler}
          placeholder="选择识别语言"
        />
        <Select
          style={{ width: 200, marginBottom: 16 }}
          options={promptOptions}
          value={selectedPrompt}
          onChange={onChangePromptHandler}
          placeholder="选择提示词"
        />
        <NavBar />
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
        </Layout>
      </Layout>
    </>
  );
};

export default App;
