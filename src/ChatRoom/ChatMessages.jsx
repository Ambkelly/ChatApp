// First, let's update ChatMessages.jsx to include editing functionality

import { Heart, Check, Trash2, Loader2, AlertCircle, Edit, X, Save } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

const ChatMessages = ({ theme, messages, user, chatRoomId, messagesEndRef }) => {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const messagesRef = useRef(null);
  const editInputRef = useRef(null);

  // Focus on edit input when editing starts
  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMessageId]);

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  const handleContextMenu = (e, messageId, messageText) => {
    e.preventDefault();
    if (messagesRef.current) {
      const rect = messagesRef.current.getBoundingClientRect();
      setContextMenu({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        messageId,
        messageText
      });
    }
  };

  const confirmDelete = (messageId) => {
    setMessageToDelete(messageId);
    setShowConfirm(true);
    setContextMenu({ ...contextMenu, visible: false });
    setError(null); // Reset error when opening confirmation
  };

  const startEditing = (messageId, text) => {
    setEditingMessageId(messageId);
    setEditText(text);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const saveEdit = async (messageId) => {
    if (!editText.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      // Get the message to check if user is the sender
      const message = messages.find(msg => msg.id === messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      // Only allow editing if user is the sender
      if (message.senderId !== user?.uid) {
        throw new Error("You can only edit your own messages");
      }

      // Update the message in Firestore
      const messageRef = doc(db, "chatRooms", chatRoomId, "messages", messageId);
      await updateDoc(messageRef, {
        text: editText.trim(),
        edited: true,
        editedAt: new Date()
      });
      
      // Show success message
      toast.success("Message updated successfully", {
        position: "bottom-center",
        style: {
          backgroundColor: theme === "dark" ? "#1E1E2F" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#000000",
        }
      });
      
      // Reset editing state
      setEditingMessageId(null);
      setEditText("");
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error(`Failed to update: ${error.message}`, {
        position: "bottom-center",
        style: {
          backgroundColor: theme === "dark" ? "#1E1E2F" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#000000",
        }
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteMessage = async () => {
    if (!messageToDelete) return;
    
    setIsDeleting(true);
    setError(null);

    try {
      // Find the message to check if user is the sender
      const message = messages.find(msg => msg.id === messageToDelete);
      if (!message) {
        throw new Error("Message not found");
      }

      // Only allow deletion if user is the sender
      if (message.senderId !== user?.uid) {
        throw new Error("You can only delete your own messages");
      }

      // Delete the message from Firestore
      const messageRef = doc(db, "chatRooms", chatRoomId, "messages", messageToDelete);
      await deleteDoc(messageRef);
      
      toast.success("Message deleted successfully", {
        position: "bottom-center",
        style: {
          backgroundColor: theme === "dark" ? "#1E1E2F" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#000000",
        }
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      setError(error.message);
      toast.error(`Failed to delete: ${error.message}`, {
        position: "bottom-center",
        style: {
          backgroundColor: theme === "dark" ? "#1E1E2F" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#000000",
        }
      });
    } finally {
      setIsDeleting(false);
      if (!error) {
        setShowConfirm(false);
        setMessageToDelete(null);
      }
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
          className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"} mb-4`}
          onContextMenu={(e) => handleContextMenu(e, msg.id, msg.text)}
        >
          <div 
            className={`flex flex-col p-3 rounded-lg max-w-xs shadow-md ${
              msg.senderId === user?.uid 
                ? "bg-green-300 hover:bg-green-400" 
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {/* Display edit interface if currently editing this message */}
            {editingMessageId === msg.id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  ref={editInputRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className={`w-full p-2 rounded text-sm ${
                    theme === "dark" ? "bg-gray-700 text-white" : "bg-white text-black"
                  }`}
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelEditing}
                    className={`p-1 rounded-full ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"}`}
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => saveEdit(msg.id)}
                    disabled={isUpdating}
                    className={`p-1 rounded-full ${theme === "dark" ? "text-green-500 hover:bg-gray-700" : "text-green-600 hover:bg-gray-200"}`}
                  >
                    {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  </button>
                </div>
              </div>
            ) : (
              // Regular message display
              <>
                {msg.text && <span className="text-sm">{msg.text}</span>}
                {msg.fileUrl && (
                  <div className="mt-2">
                    {msg.fileType?.includes("image") || msg.fileUrl.includes(".jpg") || msg.fileUrl.includes(".png") || msg.fileUrl.includes(".gif") ? (
                      <img src={msg.fileUrl} alt="file" className="max-w-full h-auto rounded-lg" />
                    ) : (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                        Download File
                      </a>
                    )}
                  </div>
                )}
                <div className="text-xs text-gray-400 flex gap-1 items-center mt-1">
                  {msg.senderId !== user?.uid && <Heart size={14} className="text-red-500" />}
                  <span>{msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...'}</span>
                  <Check size={14} />
                  {msg.edited && <span className="italic">(edited)</span>}
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      <div ref={messagesEndRef}></div>

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
          {/* Only show edit/delete for the user's own messages */}
          {messages.find(m => m.id === contextMenu.messageId)?.senderId === user?.uid && (
            <>
              <button
                onClick={() => startEditing(contextMenu.messageId, messages.find(m => m.id === contextMenu.messageId)?.text || "")}
                className={`flex items-center w-full px-4 py-2 text-sm ${
                  theme === "dark" 
                    ? "text-blue-400 hover:bg-[#3D3D4D]" 
                    : "text-blue-600 hover:bg-gray-100"
                }`}
              >
                <Edit size={16} className="mr-2" />
                Edit Message
              </button>
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
            </>
          )}
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
            
            {error && (
              <div className={`flex items-center gap-2 mb-3 p-2 rounded ${
                theme === "dark" ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-800"
              }`}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <p className={`mb-4 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}>
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setError(null);
                }}
                disabled={isDeleting}
                className={`px-3 py-1 rounded ${
                  theme === "dark" ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-800"
                } ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Cancel
              </button>
              <button
                onClick={deleteMessage}
                disabled={isDeleting}
                className={`px-3 py-1 rounded flex items-center gap-1 ${
                  isDeleting 
                    ? "bg-red-400 text-white" 
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;