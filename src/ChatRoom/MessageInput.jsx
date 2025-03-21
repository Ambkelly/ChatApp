// src/ChatRoom/MessageInput.jsx
import { Smile, Paperclip } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

const MessageInput = ({
  theme,
  inputText,
  setInputText,
  sendMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  handleEmojiClick,
  fileInputRef,
  handleFileChange,
  selectedFile,
}) => {
  return (
    <div className={`p-4 border-t ${theme === "dark" ? "bg-[#1E1E2F] border-gray-700" : "bg-white border-gray-300"}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <Smile size={20} />
        </button>
        <button
          onClick={() => fileInputRef.current.click()}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <Paperclip size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="text"
          placeholder="Message"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={`flex-1 p-2 rounded-lg focus:outline-none ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100"}`}
        />
        <button onClick={sendMessage} className="ml-2 p-2 bg-blue-500 text-white rounded-lg">Send</button>
      </div>
      {showEmojiPicker && (
        <div className="absolute bottom-20">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
      {selectedFile && (
        <div className="mt-2 text-sm text-gray-500">
          Selected file: {selectedFile.name}
        </div>
      )}
    </div>
  );
};

export default MessageInput;