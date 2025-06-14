import NavBar from "./components/NavBar";
import { FloatButton, Layout } from "antd";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { EventsOn } from "../wailsjs/runtime/runtime";
import Tesseract from "tesseract.js";

const { Content } = Layout;

const App = () => {
  const [screenshot, setScreenshot] = useState(null);
  const [selection, setSelection] = useState(null);
  const [text, setText] = useState(null);
  useEffect(() => {
    EventsOn("GET_SELECTION", (event) => {
      setSelection(event);
    });
    EventsOn("CREATE_SCREENSHOT", async (event) => {
      setScreenshot(event);
      const result = await Tesseract.recognize(event);
      setText(result.data.text);
    });
  }, []);

  return (
    <Layout
      style={{
        minHeight: "100vh",
      }}
    >
      {screenshot && <img src={screenshot} alt="Screenshot" />}
      {selection && <div>{selection}</div>}
      {text && <div>{text}</div>}
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
            ß
          >
            <Outlet />
            <FloatButton.BackTop />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
