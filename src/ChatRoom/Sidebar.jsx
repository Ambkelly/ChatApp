import { Search, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Sidebar = ({ 
  theme, 
  searchQuery, 
  setSearchQuery, 
  chatRooms, 
  currentChat, 
  setCurrentChat,
  startNewChat,
  user
}) => {
  const [users, setUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);

  // Fetch all users except current user
  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "!=", user.uid));
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    };

    fetchUsers();
  }, [user]);

  const filteredChatRooms = chatRooms.filter(room => {
    const otherUserName = room.user1Id === user?.uid 
      ? room.user2Name 
      : room.user1Name;
    return otherUserName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={`w-full h-full flex flex-col ${theme === "dark" ? "bg-[#1E1E2F]" : "bg-white"}`}>
      <div className="p-4">
        <div className={`flex items-center gap-2 border p-2 rounded-lg ${
          theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
        }`}>
          <Search className="text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-transparent focus:outline-none ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          />
        </div>
      </div>

      <div className="px-4">
        <button
          onClick={() => setShowUserList(!showUserList)}
          className={`flex items-center gap-2 w-full p-3 rounded-lg mb-2 ${
            theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <Plus size={20} />
          <span>New Chat</span>
        </button>
      </div>

      {showUserList && (
        <div className={`p-4 border-t ${
          theme === "dark" ? "border-gray-700" : "border-gray-300"
        }`}>
          <h3 className={`font-semibold mb-2 ${
            theme === "dark" ? "text-white" : "text-black"
          }`}>
            Select a user to chat with
          </h3>
          <div className="space-y-2">
            {users.map(user => (
              <div
                key={user.id}
                onClick={() => {
                  startNewChat(user.id);
                  setShowUserList(false);
                }}
                className={`p-2 rounded-lg cursor-pointer ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName} 
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{user.displayName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {filteredChatRooms.map((room) => {
          const isCurrent = currentChat?.id === room.id;
          const otherUserId = room.user1Id === user?.uid ? room.user2Id : room.user1Id;
          const otherUser = users.find(u => u.id === otherUserId);

          return (
            <div
              key={room.id}
              onClick={() => setCurrentChat(room)}
              className={`flex justify-between p-3 rounded-lg mb-2 cursor-pointer ${
                isCurrent 
                  ? theme === "dark" 
                    ? "bg-gray-700" 
                    : "bg-gray-200"
                  : theme === "dark" 
                    ? "hover:bg-gray-700" 
                    : "hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={otherUser?.photoURL || `https://ui-avatars.com/api/?name=${otherUserId[0]}&background=random`}
                  alt="avatar"
                  className="rounded-full w-10 h-10"
                />
                <div>
                  <p className={`font-semibold ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}>
                    {otherUser?.displayName || "Unknown User"}
                  </p>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {room.lastMessage?.substring(0, 20) + (room.lastMessage?.length > 20 ? "..." : "")}
                  </p>
                </div>
              </div>
              <span className={`text-xs ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>
                {room.lastMessageTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;