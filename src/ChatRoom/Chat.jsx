import { useState, useEffect, useRef } from "react";
import { auth, db, storage } from "../firebase"; // Import storage from firebase
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Menu } from "lucide-react"; // Import a menu icon for the toggle button
import Sidebar from "./Sidebar";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import MessageInput from "./MessageInput";

const ChatApp = () => {
  const [theme, setTheme] = useState("dark");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false); // State to toggle sidebar
  const fileInputRef = useRef(null);
  const [chatRoomId, setChatRoomId] = useState("default-room");

  // Fetch user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch messages
  useEffect(() => {
    const messagesRef = collection(db, "chatRooms", chatRoomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messages);
    });
    return () => unsubscribe();
  }, [chatRoomId]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const sendMessage = async () => {
    if (inputText.trim() || selectedFile) {
      try {
        let fileUrl = null;
        if (selectedFile) {
          const fileRef = ref(storage, `chatFiles/${selectedFile.name}`);
          await uploadBytes(fileRef, selectedFile);
          fileUrl = await getDownloadURL(fileRef);
        }
        await addDoc(collection(db, "chatRooms", chatRoomId, "messages"), {
          text: inputText,
          fileUrl: fileUrl,
          sender: user?.uid,
          senderName: user?.displayName || "Guest",
          timestamp: serverTimestamp(),
        });
        setInputText("");
        setSelectedFile(null);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setInputText((prevText) => prevText + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const chatList = [
    { name: "Chatgram", message: "Chatgram Web was updated.", time: "19:48", date: "2023-10-01" },
    { name: "Jessica Drew", message: "Ok, see you later", time: "18:30", date: "2023-10-01" },
    { name: "David Moore", message: "You: I don't remember anything 😅", time: "18:16", date: "2023-10-01" },
    { name: "Greg James", message: "I got a job at SpaceX 🎉🚀", time: "18:02", date: "2023-10-01" },
    { name: "Emily Dorson", message: "Table for four, 5PM. Be there.", time: "17:42", date: "2023-10-01" },
  ];

  const filteredChatList = chatList.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex h-screen ${theme === "dark" ? "bg-gradient-to-b from-[#131B63] to-[#481162]" : "bg-[#D3E3FC]"}`}>
      {/* Sidebar Toggle Button (Visible on small screens) */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className={`fixed top-4 left-4 z-50 p-2 rounded-lg ${
          theme === "dark" ? "bg-gray-700 text-white" : "bg-white text-black"
        } md:hidden`}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div
        className={`w-full md:w-1/4 p-4 border-r transform transition-transform duration-300 ${
          theme === "dark" ? "bg-[#1E1E2F] border-gray-700" : "bg-white border-gray-300"
        } ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:relative fixed h-full z-40`}
      >
        <Sidebar
          theme={theme}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          chatList={chatList}
          filteredChatList={filteredChatList}
        />
      </div>

      {/* Chat Window */}
      <div className="w-full md:w-3/4 flex flex-col">
        <ChatHeader theme={theme} toggleTheme={toggleTheme} user={user} />
        <ChatMessages theme={theme} messages={messages} user={user} />
        <MessageInput
          theme={theme}
          inputText={inputText}
          setInputText={setInputText}
          sendMessage={sendMessage}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          handleEmojiClick={handleEmojiClick}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          selectedFile={selectedFile}
        />
      </div>
    </div>
  );
};

export default ChatApp;