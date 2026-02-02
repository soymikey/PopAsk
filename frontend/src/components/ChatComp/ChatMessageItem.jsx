import { Button, Input, Typography, Avatar } from "antd";
import {
  UserOutlined,
  RobotOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { MarkDownComp } from "../MarkDownComp";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Text } = Typography;

export default function ChatMessageItem({
  message,
  isEditing,
  editingContent,
  onEditingContentChange,
  onSaveEdit,
  onCancelEdit,
  onEditMessage,
  onRegenerateResponse,
}) {
  const isUser = message.type === "user";

  return (
    <div
      style={{
        display: "flex",
        marginBottom: "16px",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          maxWidth: "80%",
          gap: "8px",
        }}
      >
        {!isUser && (
          <Avatar
            icon={<RobotOutlined />}
            style={{
              backgroundColor: "#1890ff",
              marginTop: "4px",
              flexShrink: 0,
              minWidth: "24px",
              minHeight: "24px",
            }}
            size="small"
          />
        )}
        <div
          style={{
            backgroundColor: isUser ? "#1890ff" : "#f5f5f5",
            color: isUser ? "white" : "black",
            padding: "12px 16px",
            borderRadius: "12px",
            maxWidth: "100%",
            wordWrap: "break-word",
            position: "relative",
          }}
          className="message-container"
        >
          <div style={{ marginBottom: "4px" }}>
            <Text
              style={{
                fontSize: "12px",
                color: isUser ? "rgba(255,255,255,0.8)" : "#999",
              }}
            >
              {dayjs(message.timestamp).fromNow()}
            </Text>
          </div>

          {isEditing ? (
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "8px",
                padding: "12px",
                border: "2px solid #1890ff",
                marginBottom: "8px",
                boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)",
              }}
            >
              <TextArea
                value={editingContent}
                onChange={(e) => onEditingContentChange(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 8 }}
                style={{
                  backgroundColor: "white",
                  color: "black",
                  marginBottom: "12px",
                  border: "1px solid #d9d9d9",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
                placeholder="Edit your message here..."
                onPressEnter={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    onSaveEdit();
                  }
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={onCancelEdit}
                  style={{ borderRadius: "6px" }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={onSaveEdit}
                  style={{ borderRadius: "6px" }}
                >
                  Save & Send
                </Button>
              </div>
            </div>
          ) : (
            <>
              {isUser ? (
                <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
              ) : (
                <MarkDownComp>{message.content}</MarkDownComp>
              )}

              <div
                className="message-actions"
                style={{
                  display: "flex",
                  gap: "4px",
                  opacity: 0,
                  transition: "opacity 0.2s ease",
                  pointerEvents: "none",
                }}
              >
                {isUser && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onEditMessage(message.id, message.content)}
                    style={{
                      color: "#666",
                      padding: "2px 4px",
                      height: "auto",
                      pointerEvents: "auto",
                    }}
                  />
                )}
                {!isUser && (
                  <Button
                    type="text"
                    size="small"
                    icon={<SendOutlined />}
                    onClick={() => onRegenerateResponse(message.id)}
                    style={{
                      color: "#666",
                      padding: "2px 4px",
                      height: "auto",
                      pointerEvents: "auto",
                    }}
                    title="Regenerate response"
                  />
                )}
              </div>
            </>
          )}
        </div>
        {isUser && (
          <Avatar
            icon={<UserOutlined />}
            size="small"
            style={{
              backgroundColor: "#52c41a",
              marginTop: "4px",
              flexShrink: 0,
              minWidth: "24px",
              minHeight: "24px",
            }}
          />
        )}
      </div>
    </div>
  );
}
