import { Button, Card, Input, Space, Tooltip } from "antd";
import { SendOutlined, SettingOutlined, StopOutlined } from "@ant-design/icons";
import styles from "./index.module.css";

const { TextArea } = Input;

export default function ChatInput({
  inputRef,
  askRef,
  selection,
  onSelectionChange,
  sendPlaceholderText,
  isMac,
  onSend,
  isAskLoading,
  stopRequest,
  newChatHandler,
  chatMessages,
  chatHistoryList,
  setShowPromptArea,
  showPromptArea,
}) {
  return (
    <Card size="small" title={null} className={styles.chatInputCard}>
      <Space direction="vertical" className={styles.chatInputSpace} size="middle">
        <div className={styles.chatInputRow}>
          <div className="flex-1">
            <TextArea
              ref={inputRef}
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder={sendPlaceholderText}
              value={selection}
              onChange={onSelectionChange}
              allowClear
              className={styles.chatInputTextarea}
              onPressEnter={(e) => {
                const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
                if (isCmdOrCtrl && e.shiftKey) {
                  e.preventDefault();
                  newChatHandler(chatMessages, chatHistoryList);
                  setTimeout(() => askRef.current?.click(), 200);
                } else if (isCmdOrCtrl) {
                  e.preventDefault();
                  askRef.current?.click();
                } else if (e.shiftKey) {
                  e.preventDefault();
                  newChatHandler(chatMessages, chatHistoryList);
                  setTimeout(() => askRef.current?.click(), 200);
                }
              }}
            />
          </div>
        </div>
        <div className={styles.chatInputActions}>
          <Tooltip title="Cmd+Enter to send OR Shift+Enter to send new chat">
            <Button
              disabled={selection.trim() === ""}
              title="Cmd+Enter to send"
              ref={askRef}
              type="primary"
              loading={isAskLoading}
              icon={<SendOutlined />}
              onClick={onSend}
              className={styles.chatInputSendBtn}
            >
              {isAskLoading ? "Sending..." : "Send"}
            </Button>
          </Tooltip>
          {isAskLoading && (
            <Tooltip title="Stop Request">
              <Button
                danger
                icon={<StopOutlined />}
                onClick={stopRequest}
                className={styles.chatInputStopBtn}
              />
            </Tooltip>
          )}
          <Tooltip title="Toggle Prompt" placement="bottomLeft">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setShowPromptArea(!showPromptArea)}
              title={
                showPromptArea
                  ? "Hide Prompt Settings"
                  : "Show Prompt Settings"
              }
            />
          </Tooltip>
        </div>
      </Space>
    </Card>
  );
}
