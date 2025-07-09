import {
  Card,
  List,
  Typography,
  Button,
  Spin,
  Space,
  Tooltip,
  Empty,
  Input,
  message,
} from "antd";
import {
  PlusOutlined,
  BulbOutlined,
  SearchOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { LoadPrompts } from "../../../wailsjs/go/main/App";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";

const PromptComp = ({ promptList, setPromptList }) => {
  const [messageApi, contextHolder] = message.useMessage();

  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // 加载解析后的提示词数据
  const loadPromptsData = async () => {
    setLoading(true);
    try {
      const data = await LoadPrompts();
      setPrompts(data);
    } catch (error) {
      console.error("Failed to load prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  const promptFormat = (prompt) => {
    return {
      label: prompt.act,
      value: prompt.prompt,
      shortcut: "",
    };
  };

  // 过滤prompts
  // 模糊搜索，简单实现：所有词都要部分匹配到
  const fuzzyMatch = (text, search) => {
    const words = search.split(/\s+/).filter(Boolean);
    const lower = text.toLowerCase();
    return words.every((w) => lower.includes(w));
  };

  const filteredPrompts = prompts.filter((prompt) => {
    const search = searchText.trim().toLowerCase();
    if (!search) return true;
    return fuzzyMatch(prompt.act, search) || fuzzyMatch(prompt.prompt, search);
  });

  const onAddPromptClick = (prompt) => {
    // 如果promptList中已经存在，则不添加
    if (promptList.some((p) => p.label === prompt.act)) {
      messageApi.open({
        type: "error",
        content: "Prompt already exists",
      });
      return;
    }
    const newPrompt = promptFormat(prompt);
    setPromptList((prev) => [...prev, newPrompt]);
    messageApi.success("Prompt added successfully");
  };

  useEffect(() => {
    // 页面加载时自动加载数据
    loadPromptsData();
  }, []);

  return (
    <div style={{ paddingBottom: "12px", paddingTop: "12px" }}>
      {contextHolder}
      <Spin spinning={loading}>
        <Card
          size="small"
          title={
            <div style={{ display: "flex", alignItems: "center" }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                Prompt Templates {/* https://prompts.chat/ */}
              </Typography.Title>
              <Button
                type="link"
                style={{
                  color: "#1890ff",
                  fontSize: "14px",
                }}
                onClick={() => {
                  BrowserOpenURL("https://prompts.chat/");
                }}
              >
                <LinkOutlined />
              </Button>
            </div>
          }
          style={{
            border: "1px solid #f0f0f0",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
          bodyStyle={{ padding: "12px" }}
        >
          {/* Search Bar */}
          <div style={{ marginBottom: "16px" }}>
            <Input
              placeholder="Search prompt templates..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ borderRadius: "6px" }}
            />
          </div>

          {filteredPrompts.length === 0 ? (
            <Empty
              description={
                <div style={{ textAlign: "center" }}>
                  <Typography.Text type="secondary">
                    {prompts.length === 0
                      ? "No prompt templates available"
                      : "No matching prompt templates found"}
                  </Typography.Text>
                  <br />
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: "12px" }}
                  >
                    {prompts.length === 0
                      ? "Prompt templates will appear here when available"
                      : "Try adjusting your search terms"}
                  </Typography.Text>
                </div>
              }
              style={{ marginTop: "40px" }}
            />
          ) : (
            <List
              dataSource={filteredPrompts}
              renderItem={(prompt) => (
                <List.Item
                  style={{
                    padding: "12px",
                    marginBottom: "8px",
                    border: "1px solid #f0f0f0",
                    borderRadius: "6px",
                    backgroundColor: "#fafafa",
                    transition: "all 0.2s",
                  }}
                  actions={[
                    <Tooltip title="Add to prompt list" key="add">
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => onAddPromptClick(prompt)}
                        style={{
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      >
                        Add
                      </Button>
                    </Tooltip>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Typography.Text
                        strong
                        style={{ fontSize: "14px", color: "#262626" }}
                      >
                        {prompt.act}
                      </Typography.Text>
                    }
                    description={
                      <Typography.Text
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          lineHeight: "1.5",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {prompt.prompt}
                      </Typography.Text>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Spin>
    </div>
  );
};

export default PromptComp;
