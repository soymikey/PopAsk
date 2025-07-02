import { Layout, Tabs } from "antd";
import AskComp from "./components/AskComp";
import SettingsComp from "./components/SettingsComp";
import useLocalStorage from "./hooks/useLocalStorage";
import {
  PROMPT_LIST_KEY,
  SYSTEM_SHORTCUT_KEY,
  DEFAULT_SHORTCUT_LIST,
  HISTORY_LIST_KEY,
  DEFAULT_HISTORY_LIST,
} from "./constant";
import { useEffect, useState } from "react";
import { EventsEmit } from "../wailsjs/runtime/runtime";
import "./app.css";
import { DEFAULT_PROMPT_OPTIONS } from "./data/language";
const App = () => {
  const [promptList, setPromptList] = useLocalStorage(
    PROMPT_LIST_KEY,
    DEFAULT_PROMPT_OPTIONS
  );
  const [systemShortcuts, setSystemShortcuts] = useLocalStorage(
    SYSTEM_SHORTCUT_KEY,
    DEFAULT_SHORTCUT_LIST
  );

  // history
  const [historyList, setHistoryList] = useLocalStorage(
    HISTORY_LIST_KEY,
    DEFAULT_HISTORY_LIST
  );

  const [activeKey, setActiveKey] = useState("ask");
  const onChange = (key) => {
    setActiveKey(key);
  };

  const syncShortcutList = (promptList, systemShortcuts) => {
    EventsEmit(
      "syncShortcutList",
      JSON.stringify([...promptList, ...systemShortcuts])
    );
  };

  const items = [
    {
      key: "ask",
      label: "Ask",
      children: (
        <AskComp
          setActiveKey={setActiveKey}
          promptList={promptList}
          setPromptList={setPromptList}
          systemShortcuts={systemShortcuts}
          syncShortcutList={syncShortcutList}
          historyList={historyList}
          setHistoryList={setHistoryList}
        />
      ),
    },
    {
      key: "settings",
      label: "Settings",
      children: (
        <SettingsComp
          promptList={promptList}
          setPromptList={setPromptList}
          systemShortcuts={systemShortcuts}
          setSystemShortcuts={setSystemShortcuts}
          syncShortcutList={syncShortcutList}
        />
      ),
    },
  ];
  useEffect(() => {
    syncShortcutList(promptList, systemShortcuts);
  }, []);
  return (
    <Layout
      style={{
        height: "100vh",
        overflow: "hidden",
        paddingLeft: 8,
        paddingRight: 8,
        paddingBottom: 8,
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
