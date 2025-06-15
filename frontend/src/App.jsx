import NavBar from "./components/NavBar";
import { FloatButton, Layout, Select } from "antd";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { EventsOn } from "../wailsjs/runtime/runtime";
import Tesseract from "tesseract.js";

const { Content } = Layout;

const App = () => {
  const [screenshot, setScreenshot] = useState(null);
  const [selection, setSelection] = useState(null);
  const [selectedLang, setSelectedLang] = useState("chi_sim");

  const languageOptions = [
    { value: "chi_sim", label: "简体中文" },
    { value: "eng", label: "英文" },
  ];

  useEffect(() => {
    EventsOn("GET_SELECTION", (event) => {
      setSelection(event);
    });
    EventsOn("CREATE_SCREENSHOT", async (event) => {
      setScreenshot(event);
      const result = await Tesseract.recognize(event, selectedLang);
      // 去除中文,日文,韩文之间的空格
      const formatResult = result.data.text.replace(
        /(?<=[\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF])\s+(?=[\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF])/g,
        ""
      );
      setSelection(formatResult);
    });
  }, [selectedLang]);

  const onChangeLangHandler = (value) => {
    setSelectedLang(value.join("+"));
  };
  return (
    <Layout
      style={{
        minHeight: "100vh",
      }}
    >
      {screenshot && <img src={screenshot} alt="Screenshot" />}
      {selection && <div>{selection}</div>}
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
            <Select
              mode="multiple"
              style={{ width: 200, marginBottom: 16 }}
              options={languageOptions}
              value={selectedLang}
              onChange={onChangeLangHandler}
              placeholder="选择识别语言"
            />
            <Outlet />
            <FloatButton.BackTop />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
