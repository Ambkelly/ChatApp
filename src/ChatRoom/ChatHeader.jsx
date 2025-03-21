// src/ChatRoom/ChatHeader.jsx
import { Sun, Moon, Phone, MoreVertical } from "lucide-react";

const ChatHeader = ({ theme, toggleTheme, user }) => {
  return (
    <div className={`flex justify-between items-center p-4 border-b ${theme === "dark" ? "bg-[#1E1E2F] border-gray-700" : "bg-white border-gray-300"}`}>
      <div className="flex items-center gap-2">
        <img
          src={user?.photoURL || "https://via.placeholder.com/40"}
          alt="avatar"
          className="rounded-full w-10 h-10"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/40";
          }}
        />
        <div>
          <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
            {user?.displayName || "Guest"}
          </p>
          <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            last seen 5 mins ago
          </p>
        </div>
      </div>
      <div className="flex gap-4 text-gray-500">
        <button onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Phone size={20} />
        <MoreVertical size={20} />
      </div>
    </div>
  );
};

export default ChatHeader;