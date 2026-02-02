import { Layout, Spin, Tabs } from "antd";
import { useAppStore } from "./store";
import { DEFAULT_PROMPT_OPTIONS, DEFAULT_SHORTCUT_LIST } from "./constant";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EventsEmit } from "../wailsjs/runtime/runtime";
import { IsMac } from "../wailsjs/go/main/App";

import ChatComp from "./components/ChatComp";
import PromptComp from "./components/PromptComp";
import ChatHistoryComp from "./components/ChatHistoryComp";
import SettingsComp from "./components/SettingsComp";
import ShortcutGuideComp from "./components/ShortcutGuideComp";
import "./app.css";

const App = () => {
  const [isMac, setIsMac] = useState(false);

  const promptList = useAppStore((s) => s.promptList);
  const setPromptList = useAppStore((s) => s.setPromptList);
  const systemShortcuts = useAppStore((s) => s.systemShortcuts);
  const setSystemShortcuts = useAppStore((s) => s.setSystemShortcuts);
  const chatHistoryList = useAppStore((s) => s.chatHistoryList);
  const setChatHistoryList = useAppStore((s) => s.setChatHistoryList);
  const selectedPrompt = useAppStore((s) => s.selectedPrompt);
  const setSelectedPrompt = useAppStore((s) => s.setSelectedPrompt);
  const showShortcutGuide = useAppStore((s) => s.showShortcutGuide);
  const setShowShortcutGuide = useAppStore((s) => s.setShowShortcutGuide);
  const ORCLang = useAppStore((s) => s.ORCLang);
  const setORCLang = useAppStore((s) => s.setORCLang);
  const openAIKey = useAppStore((s) => s.openAIKey);
  const setOpenAIKey = useAppStore((s) => s.setOpenAIKey);

  useEffect(() => {
    if (typeof window !== "undefined" && window?.go?.main?.App?.IsMac) {
      IsMac()
        .then(setIsMac)
        .catch(() => setIsMac(false));
    }
  }, []);

  // current chat messages (not persisted)
  const [chatMessages, setChatMessages] = useState([]);
  const [activeKey, setActiveKey] = useState("chat");

  const onChange = useCallback((key) => {
    setActiveKey(key);
  }, []);

  const syncShortcutList = useCallback((promptList, systemShortcuts) => {
    EventsEmit(
      "syncShortcutList",
      JSON.stringify([...promptList, ...systemShortcuts]),
    );
  }, []);

  const handleCloseShortcutGuide = useCallback(() => {
    setShowShortcutGuide(false);
  }, [setShowShortcutGuide]);

  const handleNeverShowShortcutGuide = useCallback(() => {
    setShowShortcutGuide(false);
  }, [setShowShortcutGuide]);

  const handleShowShortcutGuide = useCallback(() => {
    setShowShortcutGuide(true);
  }, [setShowShortcutGuide]);

  const resetShortcut = useCallback(() => {
    setSystemShortcuts(DEFAULT_SHORTCUT_LIST);
    setPromptList(DEFAULT_PROMPT_OPTIONS);
    syncShortcutList(DEFAULT_PROMPT_OPTIONS, DEFAULT_SHORTCUT_LIST);
  }, [setSystemShortcuts, setPromptList, syncShortcutList]);

  const items = useMemo(
    () => [
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
            openAIKey={openAIKey}
          />
        ),
      },
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
            isMac={isMac}
            promptList={promptList}
            setPromptList={setPromptList}
            systemShortcuts={systemShortcuts}
            setSystemShortcuts={setSystemShortcuts}
            syncShortcutList={syncShortcutList}
            showShortcutGuide={handleShowShortcutGuide}
            resetShortcut={resetShortcut}
            ORCLang={ORCLang}
            setORCLang={setORCLang}
            openAIKey={openAIKey}
            setOpenAIKey={setOpenAIKey}
          />
        ),
      },
    ],
    [
      activeKey,
      chatMessages,
      chatHistoryList,
      isMac,
      openAIKey,
      ORCLang,
      promptList,
      selectedPrompt,
      systemShortcuts,
      setActiveKey,
      setChatHistoryList,
      setChatMessages,
      setORCLang,
      setOpenAIKey,
      setPromptList,
      setSelectedPrompt,
      setSystemShortcuts,
      syncShortcutList,
      handleShowShortcutGuide,
      resetShortcut,
    ],
  );
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
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <Spin size="large" />
          </div>
        }
      >
        <Tabs
          defaultActiveKey={activeKey}
          activeKey={activeKey}
          items={items}
          onChange={onChange}
        />

        <ShortcutGuideComp
          visible={showShortcutGuide}
          onClose={handleCloseShortcutGuide}
          onNeverShow={handleNeverShowShortcutGuide}
        />
      </Suspense>
    </Layout>
  );
};

export default App;
