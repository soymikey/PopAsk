import { Layout, Tabs } from "antd";
import AskComp from "./components/AskComp";
import SettingsComp from "./components/SettingsComp";
import useLocalStorage from "./hooks/useLocalStorage";
import { PROMPT_LIST_KEY } from "./constant";
import { useEffect } from "react";
import { EventsEmit } from "../wailsjs/runtime/runtime";

const App = () => {
  const [promptList] = useLocalStorage(PROMPT_LIST_KEY, []);
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
  useEffect(() => {
    EventsEmit("syncPromptList", JSON.stringify(promptList));
  }, [promptList]);
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
