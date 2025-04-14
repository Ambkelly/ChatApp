import { useState } from "react";
import { Smile, Paperclip, Send, X, Image, File, Mic } from "lucide-react";
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
  setSelectedFile,
  handleKeyDown
}) => {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = () => {
    // This would be implemented with the Web Audio API in a real app
    setIsRecording(true);
    setTimeout(() => setIsRecording(false), 2000); // Simulate recording
  };

  return (
    <div className={`p-3 border-t ${theme === "dark" ? "bg-[#1E1E2F] border-gray-700" : "bg-white border-gray-300"}`}>
      {selectedFile && (
        <div className={`mb-2 p-2 rounded-lg flex items-center justify-between ${
          theme === "dark" ? "bg-gray-700" : "bg-gray-100"
        }`}>
          <div className="flex items-center gap-2">
            {selectedFile.type.includes("image") 
              ? <Image size={18} className={theme === "dark" ? "text-blue-400" : "text-blue-500"} />
              : <File size={18} className={theme === "dark" ? "text-green-400" : "text-green-500"} />
            }
            <span className={`text-sm truncate max-w-60 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}>
              {selectedFile.name}
            </span>
          </div>
          <button 
            onClick={() => setSelectedFile(null)}
            className={`p-1 rounded-full ${
              theme === "dark" ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {/* Emoji picker button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2 rounded-full ${
            theme === "dark" 
              ? "text-gray-400 hover:bg-gray-700" 
              : "text-gray-500 hover:bg-gray-100"
          }`}
          aria-label="Emoji picker"
        >
          <Smile size={20} />
        </button>
        
        {/* File attachment button */}
        <button
          onClick={() => fileInputRef.current.click()}
          className={`p-2 rounded-full ${
            theme === "dark" 
              ? "text-gray-400 hover:bg-gray-700" 
              : "text-gray-500 hover:bg-gray-100"
          }`}
          aria-label="Attach file"
        >
          <Paperclip size={20} />
        </button>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,video/*,audio/*"
        />
        
        {/* Text input */}
        <input
          type="text"
          placeholder="Type a message"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 p-3 rounded-full focus:outline-none ${
            theme === "dark" 
              ? "bg-gray-700 text-white placeholder-gray-400" 
              : "bg-gray-100 text-black placeholder-gray-500"
          }`}
        />
        
        {/* Voice recording or send button */}
        {!inputText.trim() && !selectedFile ? (
          <button
            onClick={startRecording}
            className={`p-3 rounded-full ${
              isRecording 
                ? "bg-red-500 text-white" 
                : theme === "dark"
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
            aria-label="Record voice message"
          >
            <Mic size={20} />
          </button>
        ) : (
          <button
            onClick={sendMessage}
            className="p-3 rounded-full bg-teal-500 text-white hover:bg-teal-600"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        )}
      </div>
      
      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-4 z-50">
          <div className={`p-1 rounded-lg shadow-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white border border-gray-200"
          }`}>
            <EmojiPicker 
              onEmojiClick={handleEmojiClick} 
              theme={theme === "dark" ? "dark" : "light"}
              searchDisabled={false}
              skinTonesDisabled={false}
              height={350}
              width={320}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;