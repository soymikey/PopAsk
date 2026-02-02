import { Layout, Tabs } from "antd";
import AskComp from "./components/AskComp";
import ChatComp from "./components/ChatComp";
import SettingsComp from "./components/SettingsComp";
import HistoryComp from "./components/HistoryComp";
import ChatHistoryComp from "./components/ChatHistoryComp";
import ShortcutGuideComp from "./components/ShortcutGuideComp";
import PromptComp from "./components/PromptComp";
import useLocalStorage from "./hooks/useLocalStorage";
import {
  PROMPT_LIST_KEY,
  SYSTEM_SHORTCUT_KEY,
  DEFAULT_SHORTCUT_LIST,
  HISTORY_LIST_KEY,
  DEFAULT_HISTORY_LIST,
  CHAT_HISTORY_LIST_KEY,
  DEFAULT_CHAT_HISTORY_LIST,
  HARDWARE_FINGERPRINT_KEY,
  SELECTED_PROMPT_KEY,
  DEFAULT_PROMPT_OPTIONS,
  DEFAULT_PROMPT_OPTIONS_VALUE,
  ORC_LANG_KEY,
  DEFAULT_ORC_LANG,
} from "./constant";
import { useEffect, useState } from "react";
import { EventsEmit } from "../wailsjs/runtime/runtime";
import "./app.css";

const App = () => {
  const [promptList, setPromptList] = useLocalStorage(
    PROMPT_LIST_KEY,
    DEFAULT_PROMPT_OPTIONS,
  );
  const [systemShortcuts, setSystemShortcuts] = useLocalStorage(
    SYSTEM_SHORTCUT_KEY,
    DEFAULT_SHORTCUT_LIST,
  );

  // history
  const [historyList, setHistoryList] = useLocalStorage(
    HISTORY_LIST_KEY,
    DEFAULT_HISTORY_LIST,
  );

  // chat history
  const [chatHistoryList, setChatHistoryList] = useLocalStorage(
    CHAT_HISTORY_LIST_KEY,
    DEFAULT_CHAT_HISTORY_LIST,
  );

  // current chat messages
  const [chatMessages, setChatMessages] = useState([]);

  const [selectedPrompt, setSelectedPrompt] = useLocalStorage(
    SELECTED_PROMPT_KEY,
    DEFAULT_PROMPT_OPTIONS_VALUE,
  );

  const [activeKey, setActiveKey] = useState("chat");

  // Shortcut guide state
  const [showShortcutGuide, setShowShortcutGuide] = useLocalStorage(
    "showShortcutGuide",
    true,
  );

  const [ORCLang, setORCLang] = useLocalStorage(ORC_LANG_KEY, DEFAULT_ORC_LANG);

  const onChange = (key) => {
    setActiveKey(key);
  };

  const syncShortcutList = (promptList, systemShortcuts) => {
    EventsEmit(
      "syncShortcutList",
      JSON.stringify([...promptList, ...systemShortcuts]),
    );
  };

  const handleCloseShortcutGuide = () => {
    setShowShortcutGuide(false);
  };

  const handleNeverShowShortcutGuide = () => {
    setShowShortcutGuide(false);
  };

  const resetShortcut = () => {
    setSystemShortcuts(DEFAULT_SHORTCUT_LIST);
    setPromptList(DEFAULT_PROMPT_OPTIONS);
    syncShortcutList(DEFAULT_PROMPT_OPTIONS, DEFAULT_SHORTCUT_LIST);
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
          activeKey={activeKey}
          setActiveKey={setActiveKey}
          promptList={promptList}
          setPromptList={setPromptList}
          systemShortcuts={systemShortcuts}
          syncShortcutList={syncShortcutList}
          chatHistoryList={chatHistoryList}
          setChatHistoryList={setChatHistoryList}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          selectedPrompt={selectedPrompt}
          setSelectedPrompt={setSelectedPrompt}
        />
      ),
    },
    // {
    //   key: "history",
    //   label: "History",
    //   children: (
    //     <HistoryComp
    //       historyList={historyList}
    //       setHistoryList={setHistoryList}
    //     />
    //   ),
    // },
    {
      key: "prompt",
      label: "Prompt",
      children: (
        <PromptComp promptList={promptList} setPromptList={setPromptList} />
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
          activeKey={activeKey}
          promptList={promptList}
          setPromptList={setPromptList}
          systemShortcuts={systemShortcuts}
          setSystemShortcuts={setSystemShortcuts}
          syncShortcutList={syncShortcutList}
          showShortcutGuide={() => setShowShortcutGuide(true)}
          resetShortcut={resetShortcut}
          ORCLang={ORCLang}
          setORCLang={setORCLang}
        />
      ),
    },
  ];
  useEffect(() => {
    syncShortcutList(promptList, systemShortcuts);
    const getLocationInfo = async () => {
      const isUserInChina = await window.go.main.App.IsUserInChina();
      window.config_.isUserInChina = isUserInChina;
    };
    getLocationInfo();
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

      {/* Shortcut Guide Modal */}
      <ShortcutGuideComp
        visible={showShortcutGuide}
        onClose={handleCloseShortcutGuide}
        onNeverShow={handleNeverShowShortcutGuide}
      />
    </Layout>
  );
};

export default App;
