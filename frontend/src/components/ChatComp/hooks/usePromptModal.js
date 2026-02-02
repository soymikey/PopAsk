import { useState } from "react";
import { Form } from "antd";
import { newPromptGenerator } from "../../../utils";
import { syncShortcutListToBackend } from "../../../utils";

export function usePromptModal(
  promptList,
  setPromptList,
  systemShortcuts,
  messageApi
) {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);

  const editPrompt = (promptId, newPrompt, newPromptTitle) => {
    const newPrompt_ = newPromptGenerator(newPromptTitle, newPrompt);
    if (!newPrompt_) {
      messageApi.open({
        type: "error",
        content: "Please enter prompt title and prompt",
      });
      return;
    }
    const updatedPromptList = promptList.map((prompt) =>
      prompt.value === promptId ? newPrompt_ : prompt
    );
    setPromptList(updatedPromptList);
    syncShortcutListToBackend(updatedPromptList, systemShortcuts);
    setIsModalVisible(false);
    setIsEditMode(false);
    setEditingPrompt(null);
    form.resetFields();
    messageApi.open({
      type: "success",
      content: "Prompt updated successfully",
    });
  };

  const handleEditPromptClick = (prompt) => {
    setIsEditMode(true);
    setEditingPrompt(prompt);
    form.setFieldsValue({
      title: prompt.label,
      prompt: prompt.value,
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setIsEditMode(false);
    setEditingPrompt(null);
    form.resetFields();
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (isEditMode && editingPrompt) {
        editPrompt(editingPrompt.value, values.prompt, values.title);
      }
    });
  };

  return {
    isModalVisible,
    setIsModalVisible,
    isEditMode,
    setIsEditMode,
    editingPrompt,
    setEditingPrompt,
    form,
    handleEditPromptClick,
    handleModalCancel,
    handleModalOk,
  };
}
