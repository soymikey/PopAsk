import { Layout, Tabs } from "antd";
import AskComp from "./components/AskComp";
import SettingsComp from "./components/SettingsComp";

const App = () => {
  const onChange = (key) => {
    console.log(key);
  };

  const items = [
    {
      key: "ask",
      label: "Ask",
      children: <AskComp />,
    },
    {
      key: "settings",
      label: "Settings",
      children: <SettingsComp />,
    },
  ];
  return (
    <Layout
      style={{
        minHeight: "100vh",
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      <Tabs
        defaultActiveKey="ask"
        items={items}
        onChange={onChange}
        destroyInactiveTabPane
      />
    </Layout>
  );
};

export default App;
