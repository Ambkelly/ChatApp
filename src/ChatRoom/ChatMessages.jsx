// src/ChatRoom/ChatMessages.jsx
import { Heart, Check, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, deleteDoc } from "firebase/firestore";

const ChatMessages = ({ theme, messages, user }) => {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const messagesRef = useRef(null);

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  const handleContextMenu = (e, messageId) => {
    e.preventDefault();
    if (messagesRef.current) {
      const rect = messagesRef.current.getBoundingClientRect();
      setContextMenu({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        messageId
      });
    }
  };

  const confirmDelete = (messageId) => {
    setMessageToDelete(messageId);
    setShowConfirm(true);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const deleteMessage = async () => {
    if (!messageToDelete) return;
    
    try {
      // Find the message to get its conversation ID
      const message = messages.find(msg => msg.id === messageToDelete);
      if (!message) return;

      // Only allow deletion if user is the sender
      if (message.sender !== auth.currentUser?.uid) {
        alert("You can only delete your own messages");
        return;
      }

      // Delete the message from Firestore
      const messageRef = doc(db, "conversations", message.conversationId, "messages", messageToDelete);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setShowConfirm(false);
      setMessageToDelete(null);
    }
  };

  return (
    <div 
      ref={messagesRef}
      className={`flex-1 p-4 overflow-y-auto relative ${theme === "dark" ? "bg-[#1E1E2F]" : "bg-blue-50"}`}
    >
      <div className={`flex justify-center text-sm my-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
        Today
      </div>
      
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex ${msg.sender === user?.uid ? "justify-end" : "justify-start"} mb-4`}
          onContextMenu={(e) => handleContextMenu(e, msg.id)}
        >
          <div 
            className={`flex items-end gap-2 p-3 rounded-lg max-w-xs shadow-md ${
              msg.sender === user?.uid 
                ? "bg-green-300 hover:bg-green-400" 
                : "bg-white hover:bg-gray-100"
            }`}
          >
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

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className={`fixed py-1 rounded-md shadow-lg z-50 ${
            theme === "dark" ? "bg-[#2D2D3D] border border-gray-700" : "bg-white border border-gray-200"
          }`}
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => confirmDelete(contextMenu.messageId)}
            className={`flex items-center w-full px-4 py-2 text-sm ${
              theme === "dark" 
                ? "text-red-400 hover:bg-[#3D3D4D]" 
                : "text-red-600 hover:bg-gray-100"
            }`}
          >
            <Trash2 size={16} className="mr-2" />
            Delete Message
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
          <div className={`p-4 rounded-lg max-w-sm w-full mx-4 ${
            theme === "dark" ? "bg-[#2D2D3D]" : "bg-white"
          }`}>
            <h3 className={`text-lg font-medium mb-3 ${
              theme === "dark" ? "text-white" : "text-black"
            }`}>
              Delete Message
            </h3>
            <p className={`mb-4 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}>
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className={`px-3 py-1 rounded ${
                  theme === "dark" ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={deleteMessage}
                className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;