import { Layout, Tabs } from "antd";
import AskComp from "./components/AskComp";
import ChatComp from "./components/ChatComp";
import SettingsComp from "./components/SettingsComp";
import HistoryComp from "./components/HistoryComp";
import ChatHistoryComp from "./components/ChatHistoryComp";
import useLocalStorage from "./hooks/useLocalStorage";
import {
  PROMPT_LIST_KEY,
  SYSTEM_SHORTCUT_KEY,
  DEFAULT_SHORTCUT_LIST,
  HISTORY_LIST_KEY,
  DEFAULT_HISTORY_LIST,
  CHAT_HISTORY_LIST_KEY,
  DEFAULT_CHAT_HISTORY_LIST,
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

  // chat history
  const [chatHistoryList, setChatHistoryList] = useLocalStorage(
    CHAT_HISTORY_LIST_KEY,
    DEFAULT_CHAT_HISTORY_LIST
  );

  // current chat messages
  const [chatMessages, setChatMessages] = useState([]);

  const [activeKey, setActiveKey] = useState("chat");
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
    // {
    //   key: "ask",
    //   label: "Ask",
    //   children: (
    //     <AskComp
    //       setActiveKey={setActiveKey}
    //       promptList={promptList}
    //       setPromptList={setPromptList}
    //       systemShortcuts={systemShortcuts}
    //       syncShortcutList={syncShortcutList}
    //       historyList={historyList}
    //       setHistoryList={setHistoryList}
    //     />
    //   ),
    // },
    {
      key: "chat",
      label: "Chat",
      children: (
        <ChatComp
          setActiveKey={setActiveKey}
          promptList={promptList}
          setPromptList={setPromptList}
          systemShortcuts={systemShortcuts}
          syncShortcutList={syncShortcutList}
          chatHistoryList={chatHistoryList}
          setChatHistoryList={setChatHistoryList}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
        />
      ),
    },
    {
      key: "history",
      label: "History",
      children: (
        <HistoryComp
          historyList={historyList}
          setHistoryList={setHistoryList}
        />
      ),
    },
    {
      key: "chatHistory",
      label: "Chat History",
      children: (
        <ChatHistoryComp
          chatHistoryList={chatHistoryList}
          setChatHistoryList={setChatHistoryList}
          setActiveKey={setActiveKey}
          setChatMessages={setChatMessages}
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
