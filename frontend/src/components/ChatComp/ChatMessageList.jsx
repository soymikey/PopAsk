import { Avatar, Spin, Typography } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import ChatMessageItem from "./ChatMessageItem";

const { Text } = Typography;

export default function ChatMessageList({
  messages,
  editingMessageId,
  editingContent,
  setEditingContent,
  onSaveEdit,
  onCancelEdit,
  onEditMessage,
  onRegenerateResponse,
  isAskLoading,
  messagesEndRef,
}) {
  return (
    <div>
      {messages.map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          isEditing={editingMessageId === message.id}
          editingContent={editingContent}
          onEditingContentChange={setEditingContent}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onEditMessage={onEditMessage}
          onRegenerateResponse={onRegenerateResponse}
        />
      ))}
      {isAskLoading && (
        <div
          style={{
            display: "flex",
            marginBottom: "16px",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <Avatar
              icon={<RobotOutlined />}
              style={{ backgroundColor: "#1890ff", marginTop: "4px" }}
              size="small"
            />
            <div
              style={{
                backgroundColor: "#f5f5f5",
                padding: "12px 16px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Spin size="small" />
              <Text>Thinking...</Text>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
