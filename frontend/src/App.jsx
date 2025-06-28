import { Layout, Tabs } from "antd";
import AskComp from "./components/AskComp";
import SettingsComp from "./components/SettingsComp";
import useLocalStorage from "./hooks/useLocalStorage";
import {
  PROMPT_LIST_KEY,
  SYSTEM_SHORTCUT_KEY,
  DEFAULT_SHORTCUT_LIST,
} from "./constant";
import { useEffect, useState } from "react";
import { EventsEmit } from "../wailsjs/runtime/runtime";

const App = () => {
  const [promptList] = useLocalStorage(PROMPT_LIST_KEY, []);
  const [systemShortcuts] = useLocalStorage(
    SYSTEM_SHORTCUT_KEY,
    DEFAULT_SHORTCUT_LIST
  );
  const [activeKey, setActiveKey] = useState("ask");
  const onChange = (key) => {
    setActiveKey(key);
  };

  const items = [
    {
      key: "ask",
      label: "Ask",
      children: <AskComp setActiveKey={setActiveKey} />,
    },
    {
      key: "settings",
      label: "Settings",
      children: <SettingsComp />,
    },
  ];
  useEffect(() => {
    EventsEmit(
      "syncShortcutList",
      JSON.stringify([...promptList, ...systemShortcuts])
    );
  }, []);
  return (
    <Layout
      style={{
        minHeight: "100vh",
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      <Tabs
        defaultActiveKey={activeKey}
        activeKey={activeKey}
        items={items}
        onChange={onChange}
      />
    </Layout>
  );
};

export default App;
