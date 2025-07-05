import React, { useEffect, useState } from "react";
import ShortcutComp from "./ShortcutComp";
import {
  Button,
  message,
  Select,
  Tooltip,
  Card,
  Space,
  Typography,
  Progress,
} from "antd";
import {
  DEFAULT_ORC_LANG,
  ORC_LANG_KEY,
  DEFAULT_DAILY_LIMIT,
} from "../../constant";
import useLocalStorage from "../../hooks/useLocalStorage";
import { OCR_LANGUAGE_OPTIONS } from "../../constant";
import { InfoCircleOutlined, SaveOutlined } from "@ant-design/icons";
import { checkDailyUsageLimit } from "../../utils";

const { Title, Text } = Typography;

function SettingsComp({
  promptList,
  setPromptList,
  systemShortcuts,
  setSystemShortcuts,
  syncShortcutList,
}) {
  const [ORCLang, setORCLang] = useLocalStorage(ORC_LANG_KEY, DEFAULT_ORC_LANG);
  const [localPromptList, setLocalPromptList] = useState([]);
  const [systemShortcutsLocal, setSystemShortcutsLocal] = useState([]);

  const [messageApi, contextHolder] = message.useMessage();

  // Get current usage information
  const usageInfo = checkDailyUsageLimit(DEFAULT_DAILY_LIMIT);

  const onChangeORCHandler = (value) => {
    if (value.length > 5) {
      messageApi.open({
        type: "error",
        content: "can't select more than 5 languages",
      });
      return;
    }
    setORCLang(value);
  };

  const validateShortcut = () => {
    const list = [...localPromptList, ...systemShortcutsLocal];
    const shortcutMap = new Map();

    for (const item of list) {
      if (!item?.shortcut) continue;

      if (shortcutMap.has(item.shortcut)) {
        return {
          error: true,
          message: `Shortcut already exists: [${item.shortcut}]`,
        };
      }
      shortcutMap.set(item.shortcut, item);
    }

    return { error: false, message: "" };
  };

  const handleSave = () => {
    const validateResult = validateShortcut();
    if (validateResult.error) {
      message.error(validateResult.message);
      return;
    }
    setPromptList(localPromptList);
    setSystemShortcuts(systemShortcutsLocal);
    syncShortcutList(localPromptList, systemShortcutsLocal);
    messageApi.open({
      type: "success",
      content: "Settings saved successfully",
    });
  };

  useEffect(() => {
    setLocalPromptList(promptList);
    setSystemShortcutsLocal(systemShortcuts);
  }, [promptList, systemShortcuts]);

  useEffect(() => {
    console.log("SettingsComp");
  }, []);

  return (
    <div style={{ paddingBottom: "12px" }}>
      {contextHolder}

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Usage Statistics */}
        <Card
          title={
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                Usage Statistics
              </Title>
              <Tooltip title="Daily usage statistics" placement="top">
                <InfoCircleOutlined style={{ color: "#1890ff" }} />
              </Tooltip>
            </Space>
          }
          size="small"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Text strong>Used today: {usageInfo.used} times</Text>
              <br />
              <Text type="secondary">
                Remaining: {usageInfo.remaining} times
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Text type="secondary">Daily limit: {usageInfo.limit} times</Text>

              <Progress
                type="circle"
                percent={Math.round((usageInfo.used / usageInfo.limit) * 100)}
                width={80}
              />
            </div>
          </div>
        </Card>

        {/* OCR Settings */}
        <Card
          title={
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                OCR Settings
              </Title>
              <Tooltip
                title="Select multiple languages for text recognition"
                placement="top"
              >
                <InfoCircleOutlined style={{ color: "#1890ff" }} />
              </Tooltip>
            </Space>
          }
          size="small"
        >
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            options={OCR_LANGUAGE_OPTIONS}
            value={ORCLang}
            onChange={onChangeORCHandler}
            placeholder="Select recognition languages (max 5)"
            maxTagCount={3}
            showSearch
          />
          <Text
            type="secondary"
            style={{ fontSize: "12px", display: "block", marginTop: "8px" }}
          >
            Select up to 5 languages for optimal OCR performance
          </Text>
        </Card>

        {/* System Shortcuts */}
        <Card
          title={
            <Title level={4} style={{ margin: 0 }}>
              System Shortcuts
            </Title>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {systemShortcutsLocal.map((item, index) => (
              <ShortcutComp
                localPrompt={item}
                setLocalPromptList={setSystemShortcutsLocal}
                localPromptList={systemShortcutsLocal}
                key={index}
              />
            ))}
            {systemShortcutsLocal.length === 0 && (
              <Text
                type="secondary"
                style={{ textAlign: "center", display: "block" }}
              >
                No system shortcuts configured
              </Text>
            )}
          </Space>
        </Card>

        {/* Prompt Shortcuts */}
        <Card
          title={
            <Title level={4} style={{ margin: 0 }}>
              Prompt Shortcuts
            </Title>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {localPromptList.map((prompt, index) => (
              <ShortcutComp
                localPrompt={prompt}
                setLocalPromptList={setLocalPromptList}
                localPromptList={localPromptList}
                key={index}
              />
            ))}
            {localPromptList.length === 0 && (
              <Text
                type="secondary"
                style={{ textAlign: "center", display: "block" }}
              >
                No prompt shortcuts configured
              </Text>
            )}
          </Space>
        </Card>

        {/* Save Button */}
        <div style={{ textAlign: "center" }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            style={{ minWidth: "120px" }}
          >
            Save Settings
          </Button>
        </div>
      </Space>
    </div>
  );
}

export default SettingsComp;
