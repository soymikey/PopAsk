import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import ShortcutComp from "./ShortcutComp";
import {
  Button,
  Select,
  Tooltip,
  Card,
  Space,
  Typography,
  Input,
} from "antd";
import { OCR_LANGUAGE_OPTIONS } from "../../constant";
import { InfoCircleOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";
import { useAppStore } from "../../store";
import { resetShortcut } from "../../utils";
import { useSettingsForm } from "./hooks/useSettingsForm";

const { Title, Text } = Typography;

function SettingsComp({ activeKey, isMac = false }) {
  const setShowShortcutGuide = useAppStore((s) => s.setShowShortcutGuide);

  const {
    contextHolder,
    localORCLang,
    setLocalORCLang,
    localOpenAIKey,
    setLocalOpenAIKey,
    localPromptList,
    setLocalPromptList,
    localSystemShortcuts,
    setLocalSystemShortcuts,
    newlyAddedPromptId,
    setNewlyAddedPromptId,
    onChangeORCHandler,
    handleSave,
    handleDragEnd,
    addCustomPrompt,
  } = useSettingsForm(activeKey);

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
          <Button type="default" onClick={() => setShowShortcutGuide(true)}>
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
