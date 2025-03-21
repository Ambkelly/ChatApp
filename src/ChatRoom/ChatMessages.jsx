// src/ChatRoom/ChatMessages.jsx
import { Heart, Check } from "lucide-react";

const ChatMessages = ({ theme, messages, user }) => {
  return (
    <div className={`flex-1 p-4 overflow-y-auto ${theme === "dark" ? "bg-[#1E1E2F]" : "bg-blue-50"}`}>
      <div className={`flex justify-center text-sm my-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Today</div>
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.sender === user?.uid ? "justify-end" : "justify-start"} mb-4`}>
          <div className={`flex items-end gap-2 p-3 rounded-lg max-w-xs shadow-md ${msg.sender === user?.uid ? "bg-green-300" : "bg-white"}`}>
            {msg.text && <span className="text-sm">{msg.text}</span>}
            {msg.fileUrl && (
              <div className="mt-2">
                {msg.fileUrl.includes(".jpg") || msg.fileUrl.includes(".png") ? (
                  <img src={msg.fileUrl} alt="file" className="max-w-full h-auto rounded-lg" />
                ) : (
                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    Download File
                  </a>
                )}
              </div>
            )}
            <div className="text-xs text-gray-400 flex gap-1 items-center">
              {msg.sender !== user?.uid && <Heart size={14} className="text-red-500" />}
              <span>{new Date(msg.timestamp?.toDate()).toLocaleTimeString()}</span>
              <Check size={14} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;