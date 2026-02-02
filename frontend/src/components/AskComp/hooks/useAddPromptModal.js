import { useState } from "react";
import { Form } from "antd";
import { newPromptGenerator } from "../../../utils";

export function useAddPromptModal({
  promptList,
  setPromptList,
  messageApi,
}) {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const addPrompt = (newPrompt, newPromptTitle) => {
    const newPrompt_ = newPromptGenerator(newPromptTitle, newPrompt);
    if (!newPrompt_) {
      messageApi.open({
        type: "error",
        content: "Please enter prompt title and prompt",
      });
      return;
    }
    setPromptList([...promptList, newPrompt_]);
    setIsModalVisible(false);
    form.resetFields();
    messageApi.open({
      type: "success",
      content: "Prompt added successfully",
    });
  };

  const handleAddPromptClick = () => {
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      addPrompt(values.prompt, values.title);
    });
  };

  return {
    isModalVisible,
    form,
    addPrompt,
    handleAddPromptClick,
    handleModalCancel,
    handleModalOk,
  };
}
