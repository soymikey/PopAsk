import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
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
  DEFAULT_DAILY_LIMIT,
  DEFAULT_PROMPT_LIST,
} from "../../constant";
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
  showShortcutGuide,
  resetShortcut,
  ORCLang,
  setORCLang,
  activeKey,
}) {
  const [localORCLang, setLocalORCLang] = useState(DEFAULT_ORC_LANG);

  const [localPromptList, setLocalPromptList] = useState(DEFAULT_PROMPT_LIST);
  const [localSystemShortcuts, setLocalSystemShortcuts] = useState([]);

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
    setLocalORCLang(value);
  };

  const validateShortcut = () => {
    const list = [...localPromptList, ...localSystemShortcuts];
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
    setORCLang(localORCLang);
    setPromptList(localPromptList);
    setSystemShortcuts(localSystemShortcuts);
    syncShortcutList(localPromptList, localSystemShortcuts);
    messageApi.open({
      type: "success",
      content: "Settings saved successfully",
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(localPromptList);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    // 如果顺序没有变化，则不更新
    if (JSON.stringify(items) === JSON.stringify(localPromptList)) {
      return;
    }
    setLocalPromptList(items);
  };

  useEffect(() => {
    setLocalPromptList(promptList);
  }, [promptList, systemShortcuts]);

  useEffect(() => {
    setLocalSystemShortcuts(systemShortcuts);
  }, [systemShortcuts]);

  useEffect(() => {
    setLocalORCLang(localORCLang);
  }, [ORCLang]);

  useEffect(() => {
    console.log("SettingsComp");
  }, []);

  useEffect(() => {
    if (activeKey === "settings") {
      setLocalORCLang(ORCLang);
      setLocalPromptList(promptList);
      setLocalSystemShortcuts(systemShortcuts);
    }
  }, [activeKey]);

  return (
    <div>
      {contextHolder}

      <div style={{ width: "100%", position: "relative" }}>
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
            value={localORCLang}
            onChange={onChangeORCHandler}
            placeholder="Select a language for more accurate OCR"
            maxTagCount={3}
            showSearch
          />
          <Text
            type="secondary"
            style={{ fontSize: "12px", display: "block", marginTop: "8px" }}
          >
            up to 5 languages
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
            {localSystemShortcuts.map((item, index) => (
              <ShortcutComp
                isShowDragIcon={false}
                localPrompt={item}
                setLocalPromptList={setLocalSystemShortcuts}
                localPromptList={localSystemShortcuts}
                key={index}
              />
            ))}
            {localSystemShortcuts.length === 0 && (
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
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                Prompt Shortcuts
              </Title>
              <span style={{ fontSize: "12px", color: "#999" }}>
                (drag to reorder)
              </span>
            </Space>
          }
          size="small"
        >
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="prompt-shortcuts">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="middle"
                  >
                    {localPromptList.map((prompt, index) => (
                      <Draggable
                        key={prompt.value || index}
                        draggableId={prompt.value || index.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                            }}
                          >
                            <ShortcutComp
                              isShowDragIcon={true}
                              localPrompt={prompt}
                              setLocalPromptList={setLocalPromptList}
                              localPromptList={localPromptList}
                            />
                          </div>
                        )}
                      </Draggable>
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
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Card>

        {/* Save Button */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            padding: "16px 0",
            marginTop: "16px",
            textAlign: "center",
            zIndex: 10,
            display: "flex",
            justifyContent: "space-evenly",
            backgroundColor: "#f5f5f5",
          }}
        >
          <Button type="default" onClick={showShortcutGuide}>
            📋 View Shortcut Guide
          </Button>

          {/* restore default shortcuts */}
          <Button type="default" onClick={resetShortcut}>
            🔄 Reset Shortcuts
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SettingsComp;
