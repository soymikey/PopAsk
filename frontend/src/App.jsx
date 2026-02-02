import { Layout, Spin, Tabs } from "antd";
import { useAppStore } from "./store";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { IsUserInChina } from "../wailsjs/go/main/App";
import { syncShortcutListToBackend } from "./utils";

import ChatComp from "./components/ChatComp";
import PromptComp from "./components/PromptComp";
import ChatHistoryComp from "./components/ChatHistoryComp";
import SettingsComp from "./components/SettingsComp";
import ShortcutGuideComp from "./components/ShortcutGuideComp";
import "./app.css";
import styles from "./App.module.css";

const App = () => {
  const isMac = useAppStore((s) => s.platform.isMac);
  const showShortcutGuide = useAppStore((s) => s.showShortcutGuide);
  const setShowShortcutGuide = useAppStore((s) => s.setShowShortcutGuide);
  const setPlatform = useAppStore((s) => s.setPlatform);

  useEffect(() => {
    if (typeof window !== "undefined" && window?.go?.main?.App?.IsUserInChina) {
      IsUserInChina()
        .then((isUserInChina) => setPlatform({ isUserInChina }))
        .catch(() => setPlatform({ isUserInChina: false }));
    }
  }, [setPlatform]);

  // current chat messages (not persisted)
  const [chatMessages, setChatMessages] = useState([]);
  const [activeKey, setActiveKey] = useState("chat");

  const onChange = useCallback((key) => {
    setActiveKey(key);
  }, []);

  const handleCloseShortcutGuide = useCallback(() => {
    setShowShortcutGuide(false);
  }, [setShowShortcutGuide]);

  const handleNeverShowShortcutGuide = useCallback(() => {
    setShowShortcutGuide(false);
  }, [setShowShortcutGuide]);

  const items = useMemo(
    () => [
      {
        key: "chat",
        label: "Chat",
        children: (
          <ChatComp
            activeKey={activeKey}
            setActiveKey={setActiveKey}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
          />
        ),
      },
      {
        key: "prompt",
        label: "Prompt",
        children: <PromptComp />,
      },
      {
        key: "chatHistory",
        label: "Chat History",
        children: (
          <ChatHistoryComp
            setActiveKey={setActiveKey}
            setChatMessages={setChatMessages}
          />
        ),
      },
      {
        key: "settings",
        label: "Settings",
        children: <SettingsComp activeKey={activeKey} isMac={isMac} />,
      },
    ],
    [activeKey, chatMessages, isMac, setActiveKey, setChatMessages],
  );
  useEffect(() => {
    const { promptList, systemShortcuts } = useAppStore.getState();
    syncShortcutListToBackend(promptList, systemShortcuts);
  }, []);

  return (
    <Layout className={styles.layout}>
      <Suspense
        fallback={
          <div className={styles.suspenseFallback}>
            <Spin size="large" />
          </div>
        }
      >
        <Tabs
          defaultActiveKey={activeKey}
          activeKey={activeKey}
          items={items}
          onChange={onChange}
          destroyInactiveTabPane={false}
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
