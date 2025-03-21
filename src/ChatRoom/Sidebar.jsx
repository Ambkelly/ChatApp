// src/ChatRoom/Sidebar.jsx
import { Search } from "lucide-react";

const Sidebar = ({ theme, searchQuery, setSearchQuery, chatList, filteredChatList }) => {
  return (
    <div className={`w-full md:w-full p-4 border-r ${theme === "dark" ? "bg-[#1E1E2F] border-gray-700" : "bg-white border-gray-300"}`}>
      <div className="flex items-center gap-2 border p-2 rounded-lg bg-gray-100">
        <Search className="text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent focus:outline-none"
        />
      </div>
      <div className="mt-4">
        {filteredChatList.map((chat, index) => (
          <div
            key={index}
            className={`flex justify-between p-3 hover:bg-gray-200 rounded-lg cursor-pointer ${theme === "dark" ? "hover:bg-gray-700" : ""}`}
          >
            <div>
              <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>{chat.name}</p>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{chat.message}</p>
            </div>
            <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{chat.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;