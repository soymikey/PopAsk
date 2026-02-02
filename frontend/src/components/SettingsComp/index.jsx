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
  Input,
} from "antd";
import {
  DEFAULT_ORC_LANG,
  DEFAULT_PROMPT_LIST,
} from "../../constant";
import { OCR_LANGUAGE_OPTIONS } from "../../constant";
import { InfoCircleOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";

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
  openAIKey,
  setOpenAIKey,
  activeKey,
  isMac = false,
}) {
  const [localORCLang, setLocalORCLang] = useState(DEFAULT_ORC_LANG);
  const [localOpenAIKey, setLocalOpenAIKey] = useState("");

  const [localPromptList, setLocalPromptList] = useState(DEFAULT_PROMPT_LIST);
  const [localSystemShortcuts, setLocalSystemShortcuts] = useState([]);
  const [newlyAddedPromptId, setNewlyAddedPromptId] = useState(null);

  const [messageApi, contextHolder] = message.useMessage();

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
    setOpenAIKey(localOpenAIKey);
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
    if (JSON.stringify(items) === JSON.stringify(localPromptList)) return;
    setLocalPromptList(items);
  };

  const addCustomPrompt = () => {
    const hasIncompleteCustom = localPromptList.some(
      (p) => p?.id?.startsWith?.("custom_") && (!p.label?.trim() || !p.value?.trim()),
    );
    if (hasIncompleteCustom) {
      messageApi.warning("Finish editing the current custom prompt (name and content) first.");
      return;
    }
    const newItem = { id: `custom_${Date.now()}`, label: "", value: "", shortcut: "" };
    setNewlyAddedPromptId(newItem.id);
    setLocalPromptList([newItem, ...localPromptList]);
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
    if (activeKey === "settings") {
      setLocalORCLang(ORCLang);
      setLocalOpenAIKey(openAIKey ?? "");
      setLocalPromptList(promptList);
      setLocalSystemShortcuts(systemShortcuts);
    }
  }, [activeKey]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {contextHolder}

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {/* OpenAI API Key */}
        <Card
          title={
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                OpenAI API Key
              </Title>
              <Tooltip title="Your key is stored locally and never sent to our servers" placement="top">
                <InfoCircleOutlined style={{ color: "#1890ff" }} />
              </Tooltip>
            </Space>
          }
          size="small"
        >
          <Input.Password
            placeholder="sk-..."
            value={localOpenAIKey}
            onChange={(e) => setLocalOpenAIKey(e.target.value)}
            allowClear
          />
          <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: "8px" }}>
            Optional. Leave empty to use the default service.
          </Text>
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
                isMac={isMac}
                localPrompt={item}
                setLocalPromptList={setLocalSystemShortcuts}
                localPromptList={localSystemShortcuts}
                index={index}
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
          extra={
            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addCustomPrompt}>
              Add custom prompt
            </Button>
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
                        key={prompt.id || prompt.value || index}
                        draggableId={String(prompt.id || prompt.value || index)}
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
                              isMac={isMac}
                              localPrompt={prompt}
                              setLocalPromptList={setLocalPromptList}
                              localPromptList={localPromptList}
                              index={index}
                              initialEditMode={prompt?.id === newlyAddedPromptId}
                              onEditModeConsumed={() => setNewlyAddedPromptId(null)}
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
      </div>

      {/* Save Button - pinned to bottom */}
      <div
        style={{
          flexShrink: 0,
          padding: "16px 0",
          marginTop: "16px",
          textAlign: "center",
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
  );
}

export default SettingsComp;
