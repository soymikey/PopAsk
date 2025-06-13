import NavBar from "./components/NavBar";
import { FloatButton, Layout } from "antd";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { EventsOn } from "../wailsjs/runtime/runtime";

const { Content } = Layout;

const App = () => {
  useEffect(() => {
    EventsOn("GET_SELECTION", (event) => {
      console.log("event", event);
    });
  }, []);

  return (
    <Layout
      style={{
        minHeight: "100vh",
      }}
    >
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
  );
};

export default App;
