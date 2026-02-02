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
  Collapse,
} from "antd";
import {
  PlusOutlined,
  BulbOutlined,
  SearchOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { LoadPromptsJSON } from "../../../wailsjs/go/main/App";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import { useAppStore } from "../../store";

const PromptComp = () => {
  const promptList = useAppStore((s) => s.promptList);
  const setPromptList = useAppStore((s) => s.setPromptList);
  const [messageApi, contextHolder] = message.useMessage();

  const [promptsCategories, setPromptsCategories] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // 加载解析后的提示词数据
  const loadPromptsData = async () => {
    setLoading(true);
    try {
      const data = await LoadPromptsJSON();
      setPromptsCategories(data);
      // 从每个category中提取prompts并扁平化
      const allPrompts = data.flatMap((category) => category.prompts || []);
      setPrompts(allPrompts);
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

  // 过滤categories和prompts
  const filteredCategories = promptsCategories
    .map((category) => {
      const filteredPrompts = (category.prompts || []).filter((prompt) => {
        const search = searchText.trim().toLowerCase();
        if (!search) return true;
        return (
          fuzzyMatch(prompt.act, search) || fuzzyMatch(prompt.prompt, search)
        );
      });
      return {
        ...category,
        prompts: filteredPrompts,
      };
    })
    .filter((category) => category.prompts.length > 0);

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

          {filteredCategories.length === 0 ? (
            <Empty
              description={
                <div style={{ textAlign: "center" }}>
                  <Typography.Text type="secondary">
                    {promptsCategories.length === 0
                      ? "No prompt templates available"
                      : "No matching prompt templates found"}
                  </Typography.Text>
                  <br />
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: "12px" }}
                  >
                    {promptsCategories.length === 0
                      ? "Prompt templates will appear here when available"
                      : "Try adjusting your search terms"}
                  </Typography.Text>
                </div>
              }
              style={{ marginTop: "40px" }}
            />
          ) : (
            <Collapse
              defaultActiveKey={[]}
              ghost
              style={{ background: "transparent" }}
            >
              {filteredCategories.map((category, categoryIndex) => (
                <Collapse.Panel
                  key={categoryIndex}
                  header={
                    <Typography.Text strong style={{ fontSize: "14px" }}>
                      {category.name}
                    </Typography.Text>
                  }
                  style={{
                    marginBottom: "8px",
                    border: "1px solid #f0f0f0",
                    borderRadius: "6px",
                    backgroundColor: "#fafafa",
                  }}
                >
                  <List
                    dataSource={category.prompts}
                    renderItem={(prompt) => (
                      <List.Item
                        style={{
                          padding: "8px 0",
                          borderBottom: "1px solid #f0f0f0",
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
                              style={{ fontSize: "13px", color: "#262626" }}
                            >
                              {prompt.act}
                            </Typography.Text>
                          }
                          description={
                            <Typography.Text
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                lineHeight: "1.4",
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
                </Collapse.Panel>
              ))}
            </Collapse>
          )}
        </Card>
      </Spin>
    </div>
  );
};

export default PromptComp;
