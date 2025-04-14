import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db, storage } from "../firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  where,
  or,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Menu, Check, Mic, Reply, Edit, X } from "lucide-react";
import Sidebar from "./Sidebar";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import MessageInput from "./MessageInput";
import { toast } from "react-hot-toast";

const ChatApp = () => {
  const [theme, setTheme] = useState("dark");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [chatRooms, setChatRooms] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        // Create user document if it doesn't exist
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.email[0]}&background=random`,
            email: user.email,
            uid: user.uid,
            lastSeen: serverTimestamp(),
            status: 'online'
          });
        } else {
          // Update online status
          await updateDoc(userRef, {
            lastSeen: serverTimestamp(),
            status: 'online'
          });
        }
      } else {
        setUser(null);
      }
    });
    
    // Set up beforeunload event to update status when user leaves
    const handleBeforeUnload = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          status: 'offline',
          lastSeen: serverTimestamp()
        });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Fetch user's chat rooms
  useEffect(() => {
    if (!user) return;

    const chatRoomsRef = collection(db, "chatRooms");
    const q = query(
      chatRoomsRef,
      or(
        where("user1Id", "==", user.uid),
        where("user2Id", "==", user.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatRooms(rooms);
      
      // Set the first chat as current if none is selected
      if (rooms.length > 0 && !currentChat) {
        setCurrentChat(rooms[0]);
      }
    });

    return () => unsubscribe();
  }, [user, currentChat]);

  // Message fetching with instant deletion handling
  useEffect(() => {
    if (!currentChat?.id) return;

    let isMounted = true;
    const messagesRef = collection(db, "chatRooms", currentChat.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isMounted) return;
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") {
          // Remove deleted message from state immediately
          setMessages(prevMessages => prevMessages.filter(m => m.id !== change.doc.id));
          return;
        }

        if (change.type === "added" || change.type === "modified") {
          const message = {
            id: change.doc.id,
            ...change.doc.data(),
            timestamp: change.doc.data().timestamp?.toDate 
              ? change.doc.data().timestamp 
              : { toDate: () => new Date() }
          };
          
          setMessages(prevMessages => {
            // If modified, replace existing message
            if (change.type === "modified") {
              return prevMessages.map(prevMsg => 
                prevMsg.id === message.id ? message : prevMsg
              );
            }
            
            // If added, only add if not already present
            if (!prevMessages.some(m => m.id === message.id)) {
              return [...prevMessages, message].sort((a, b) => 
                a.timestamp.toDate() - b.timestamp.toDate()
              );
            }
            
            return prevMessages;
          });
        }
      });

      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentChat]);

  // Typing indicator with debounce
  const handleTyping = useCallback(() => {
    if (!currentChat?.id || !user) return;

    const typingRef = doc(db, "chatRooms", currentChat.id, "typing", user.uid);
    
    if (inputText || editingMessage) {
      // User is typing
      setDoc(typingRef, { 
        isTyping: true,
        timestamp: serverTimestamp() 
      }, { merge: true });
      
      // Clear typing status after 3 seconds of inactivity
      if (typingTimeout) clearTimeout(typingTimeout);
      const timeout = setTimeout(() => {
        setDoc(typingRef, { isTyping: false }, { merge: true });
      }, 3000);
      setTypingTimeout(timeout);
    } else {
      // User stopped typing
      setDoc(typingRef, { isTyping: false }, { merge: true });
    }
  }, [inputText, currentChat, user, typingTimeout, editingMessage]);

  useEffect(() => {
    const debounceTimer = setTimeout(handleTyping, 500);
    return () => clearTimeout(debounceTimer);
  }, [inputText, editingMessage, handleTyping]);

  // Listen for typing indicators from other users
  useEffect(() => {
    if (!currentChat?.id || !user) return;

    const typingRef = collection(db, "chatRooms", currentChat.id, "typing");
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      let someoneTyping = false;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (doc.id !== user.uid && data.isTyping) {
          someoneTyping = true;
        }
      });
      setIsTyping(someoneTyping);
    });

    return () => unsubscribe();
  }, [currentChat, user]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("chatTheme", newTheme);
  };

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("chatTheme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const sendMessage = async () => {
    if ((inputText.trim() || selectedFile) && currentChat?.id && user) {
      try {
        // Clear reply/edit states
        setReplyingTo(null);
        setEditingMessage(null);
        
        // Create a temporary message ID for optimistic UI updates
        const tempMessageId = `temp-${Date.now()}`;
        const currentTime = new Date();
        
        // Create message object
        const messageData = {
          id: tempMessageId,
          text: inputText.trim(),
          senderId: user.uid,
          senderName: user.displayName || user.email.split('@')[0],
          timestamp: { toDate: () => currentTime },
          read: false,
          pending: true,
          replyTo: replyingTo?.id || null,
          edited: false
        };
        
        // Optimistically add message to UI immediately
        setMessages(prevMessages => [...prevMessages, messageData]);
        
        // Clear input and scroll to bottom immediately
        setInputText("");
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        
        // Upload file if selected
        let fileUrl = null;
        let fileType = null;
        
        if (selectedFile) {
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === tempMessageId 
                ? { ...msg, text: msg.text + " (uploading file...)" } 
                : msg
            )
          );
          
          const fileRef = ref(storage, `chatFiles/${currentChat.id}/${Date.now()}_${selectedFile.name}`);
          await uploadBytes(fileRef, selectedFile);
          fileUrl = await getDownloadURL(fileRef);
          fileType = selectedFile.type;
          setSelectedFile(null);
        }
        
        // Add message to Firestore
        const docRef = await addDoc(collection(db, "chatRooms", currentChat.id, "messages"), {
          text: inputText.trim(),
          fileUrl: fileUrl,
          fileType: fileType,
          senderId: user.uid,
          senderName: user.displayName || user.email.split('@')[0],
          timestamp: serverTimestamp(),
          read: false,
          replyTo: replyingTo?.id || null,
          edited: false
        });

        // Update last message in chat room
        const chatRef = doc(db, "chatRooms", currentChat.id);
        await updateDoc(chatRef, {
          lastMessage: inputText.trim() || (fileType?.includes("image") ? "📷 Image" : "📎 File"),
          lastMessageTime: serverTimestamp(),
          lastSenderId: user.uid
        });

        // Clear typing indicator
        const typingRef = doc(db, "chatRooms", currentChat.id, "typing", user.uid);
        await setDoc(typingRef, { isTyping: false }, { merge: true });
        
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.pending ? { ...msg, text: msg.text + " (failed to send)", error: true } : msg
          )
        );
        toast.error("Failed to send message");
      }
    }
  };

  const editMessage = async () => {
    if (editingMessage && inputText.trim() && currentChat?.id && user) {
      try {
        // Update message in Firestore
        const messageRef = doc(db, "chatRooms", currentChat.id, "messages", editingMessage.id);
        await updateDoc(messageRef, {
          text: inputText.trim(),
          edited: true
        });

        // Update last message in chat room if this was the last message
        if (messages[messages.length - 1]?.id === editingMessage.id) {
          const chatRef = doc(db, "chatRooms", currentChat.id);
          await updateDoc(chatRef, {
            lastMessage: inputText.trim(),
            lastMessageTime: serverTimestamp()
          });
        }

        // Clear states
        setEditingMessage(null);
        setInputText("");
        
      } catch (error) {
        console.error("Error editing message:", error);
        toast.error("Failed to edit message");
      }
    }
  };

  const deleteMessage = async (messageId) => {
    if (messageId && currentChat?.id && user) {
      try {
        // Check if user is the sender
        const messageToDelete = messages.find(m => m.id === messageId);
        if (messageToDelete?.senderId !== user.uid) {
          toast.error("You can only delete your own messages");
          return;
        }

        // Optimistically remove message from UI immediately
        setMessages(prevMessages => prevMessages.filter(m => m.id !== messageId));

        // Delete message from Firestore
        await deleteDoc(doc(db, "chatRooms", currentChat.id, "messages", messageId));

        // Update last message in chat room if this was the last message
        if (messages[messages.length - 1]?.id === messageId) {
          const chatRef = doc(db, "chatRooms", currentChat.id);
          const prevMessage = messages[messages.length - 2];
          
          await updateDoc(chatRef, {
            lastMessage: prevMessage?.text || (prevMessage?.fileType?.includes("image") ? "📷 Image" : "📎 File"),
            lastMessageTime: prevMessage?.timestamp || serverTimestamp(),
            lastSenderId: prevMessage?.senderId || ""
          });
        }

        toast.success("Message deleted");
      } catch (error) {
        console.error("Error deleting message:", error);
        // Revert the optimistic update if deletion fails
        setMessages(prevMessages => [...prevMessages, messageToDelete]);
        toast.error("Failed to delete message");
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        sendVoiceNote(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const sendVoiceNote = async (audioBlob) => {
    try {
      const tempMessageId = `temp-${Date.now()}`;
      const currentTime = new Date();
      
      // Optimistically add message to UI
      setMessages(prevMessages => [...prevMessages, {
        id: tempMessageId,
        text: "Voice message",
        senderId: user.uid,
        senderName: user.displayName || user.email.split('@')[0],
        timestamp: { toDate: () => currentTime },
        read: false,
        pending: true,
        isVoiceNote: true,
        fileType: 'audio/mp3'
      }]);
      
      // Upload audio file
      const audioRef = ref(storage, `chatFiles/${currentChat.id}/${Date.now()}_voice_note.mp3`);
      await uploadBytes(audioRef, audioBlob);
      const audioUrl = await getDownloadURL(audioRef);
      
      // Add message to Firestore
      const docRef = await addDoc(collection(db, "chatRooms", currentChat.id, "messages"), {
        text: "Voice message",
        fileUrl: audioUrl,
        fileType: 'audio/mp3',
        senderId: user.uid,
        senderName: user.displayName || user.email.split('@')[0],
        timestamp: serverTimestamp(),
        read: false,
        isVoiceNote: true
      });

      // Update last message in chat room
      const chatRef = doc(db, "chatRooms", currentChat.id);
      await updateDoc(chatRef, {
        lastMessage: "🎤 Voice message",
        lastMessageTime: serverTimestamp(),
        lastSenderId: user.uid
      });

      // Scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      
    } catch (error) {
      console.error("Error sending voice note:", error);
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempMessageId 
            ? { ...msg, text: "Failed to send voice message", error: true } 
            : msg
        )
      );
      toast.error("Failed to send voice message");
    }
  };

  const startNewChat = async (otherUserId) => {
    if (!user || user.uid === otherUserId) return;

    // Check if chat already exists
    const existingChat = chatRooms.find(room => 
      (room.user1Id === user.uid && room.user2Id === otherUserId) ||
      (room.user1Id === otherUserId && room.user2Id === user.uid)
    );

    if (existingChat) {
      setCurrentChat(existingChat);
      return;
    }

    try {
      // Get other user details
      const otherUserRef = doc(db, "users", otherUserId);
      const otherUserDoc = await getDoc(otherUserRef);
      
      if (!otherUserDoc.exists()) {
        toast.error("User not found");
        return;
      }
      
      const otherUserData = otherUserDoc.data();

      // Create new chat room
      const chatRef = await addDoc(collection(db, "chatRooms"), {
        user1Id: user.uid,
        user2Id: otherUserId,
        user1Name: user.displayName || user.email.split('@')[0],
        user2Name: otherUserData.displayName || otherUserData.email.split('@')[0],
        user1Photo: user.photoURL || `https://ui-avatars.com/api/?name=${user.email[0]}&background=random`,
        user2Photo: otherUserData.photoURL || `https://ui-avatars.com/api/?name=${otherUserData.email[0]}&background=random`,
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        lastSenderId: ""
      });

      // Set as current chat
      const newChat = {
        id: chatRef.id,
        user1Id: user.uid,
        user2Id: otherUserId,
        user1Name: user.displayName || user.email.split('@')[0],
        user2Name: otherUserData.displayName || otherUserData.email.split('@')[0],
        user1Photo: user.photoURL || `https://ui-avatars.com/api/?name=${user.email[0]}&background=random`,
        user2Photo: otherUserData.photoURL || `https://ui-avatars.com/api/?name=${otherUserData.email[0]}&background=random`,
      };
      
      setCurrentChat(newChat);
      toast.success(`Chat with ${otherUserData.displayName || otherUserData.email} created!`);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to create chat");
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setInputText((prevText) => prevText + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        editMessage();
      } else {
        sendMessage();
      }
    }
  };

  const MessageDisplay = ({ message, isCurrentUser, theme }) => {
    const repliedToMessage = messages.find(m => m.id === message.replyTo);
    
    return (
      <div 
        className={`flex flex-col p-3 rounded-lg max-w-xs shadow-md ${
          message.error 
            ? "bg-red-100 border border-red-300" 
            : isCurrentUser 
              ? theme === "dark" 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-green-300 hover:bg-green-400"
              : theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-white hover:bg-gray-100"
        }`}
      >
        {/* Reply preview */}
        {repliedToMessage && (
          <div className={`text-xs p-2 mb-2 rounded-t-lg border-l-4 ${
            theme === "dark" ? "border-blue-400 bg-gray-800" : "border-green-400 bg-gray-100"
          }`}>
            <div className="font-semibold truncate">
              {repliedToMessage.senderId === user.uid ? "You" : repliedToMessage.senderName}
            </div>
            <div className="truncate">
              {repliedToMessage.text || (repliedToMessage.fileType?.includes("image") ? "📷 Image" : "📎 File")}
            </div>
          </div>
        )}
        
        {message.text && !message.isVoiceNote && (
          <span className={`text-sm ${theme === "dark" && isCurrentUser ? "text-white" : ""}`}>
            {message.text}
          </span>
        )}
        
        {message.fileUrl && (
          <div className="mt-2">
            {message.isVoiceNote ? (
              <audio controls className="w-full">
                <source src={message.fileUrl} type="audio/mp3" />
                Your browser does not support the audio element.
              </audio>
            ) : message.fileType?.includes("image") ? (
              <img 
                src={message.fileUrl} 
                alt="file" 
                className="max-w-full h-auto rounded-lg" 
                loading="lazy"
              />
            ) : (
              <a 
                href={message.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`underline ${theme === "dark" && isCurrentUser ? "text-blue-200" : "text-blue-500"}`}
              >
                Download File
              </a>
            )}
          </div>
        )}
        
        <div className={`text-xs flex gap-1 items-center mt-1 ${
          theme === "dark" && isCurrentUser ? "text-blue-200" : "text-gray-500"
        }`}>
          <span>
            {message.timestamp ? 
              new Date(message.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
              'Sending...'}
          </span>
          {message.pending ? (
            <span className="animate-pulse">●</span>
          ) : (
            <Check size={14} className={message.error ? "text-red-500" : ""} />
          )}
          {message.edited && <span className="italic">(edited)</span>}
          {message.error && (
            <span className="text-red-500 ml-1">Error</span>
          )}
        </div>
        
        {/* Message actions */}
        {isCurrentUser && !message.pending && !message.error && (
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => {
                setReplyingTo(message);
                setEditingMessage(null);
              }}
              className={`text-xs p-1 rounded ${
                theme === "dark" ? "hover:bg-blue-800" : "hover:bg-green-200"
              }`}
              title="Reply"
            >
              <Reply size={14} />
            </button>
            <button 
              onClick={() => {
                setEditingMessage(message);
                setInputText(message.text);
                setReplyingTo(null);
              }}
              className={`text-xs p-1 rounded ${
                theme === "dark" ? "hover:bg-blue-800" : "hover:bg-green-200"
              }`}
              title="Edit"
            >
              <Edit size={14} />
            </button>
            <button 
              onClick={() => deleteMessage(message.id)}
              className={`text-xs p-1 rounded ${
                theme === "dark" ? "hover:bg-blue-800" : "hover:bg-green-200"
              }`}
              title="Delete"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex h-screen ${theme === "dark" ? "bg-gradient-to-b from-[#131B63] to-[#481162]" : "bg-[#D3E3FC]"}`}>
      {/* Sidebar Toggle Button */}
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
        className={`w-full md:w-1/3 lg:w-1/4 p-0 border-r transform transition-transform duration-300 ${
          theme === "dark" ? "bg-[#1E1E2F] border-gray-700" : "bg-white border-gray-300"
        } ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:relative fixed h-full z-40`}
      >
        <Sidebar
          theme={theme}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          chatRooms={chatRooms}
          currentChat={currentChat}
          setCurrentChat={setCurrentChat}
          startNewChat={startNewChat}
          user={user}
          toggleTheme={toggleTheme}
        />
      </div>

      {/* Chat Window */}
      <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
        {currentChat ? (
          <>
            <ChatHeader 
              theme={theme} 
              toggleTheme={toggleTheme} 
              user={user} 
              currentChat={currentChat}
              isTyping={isTyping}
            />
            <ChatMessages 
              theme={theme} 
              messages={messages} 
              user={user} 
              chatRoomId={currentChat.id}
              messagesEndRef={messagesEndRef}
              MessageDisplay={MessageDisplay}
              setReplyingTo={setReplyingTo}
            />
            <MessageInput
              theme={theme}
              inputText={inputText}
              setInputText={setInputText}
              sendMessage={editingMessage ? editMessage : sendMessage}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              handleEmojiClick={handleEmojiClick}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              selectedFile={selectedFile}
              handleKeyDown={handleKeyDown}
              isRecording={isRecording}
              startRecording={startRecording}
              stopRecording={stopRecording}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              editingMessage={editingMessage}
              setEditingMessage={setEditingMessage}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <div className={`text-center p-8 rounded-lg ${
              theme === "dark" ? "bg-[#1E1E2F] text-white" : "bg-white text-gray-800 shadow-lg"
            }`}>
              <img 
                src="kelly Chat.png" 
                alt="WhatsApp-like chat" 
                className="w-40 h-40 mx-auto mb-4 opacity-80"
              />
              <h2 className="text-2xl font-bold mb-2">Welcome to Kelly Chat</h2>
              <p className="mb-6 text-gray-500">Connect with friends and start chatting</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => document.querySelector('[data-testid="new-chat-button"]')?.click()}
                  className={`px-6 py-3 rounded-lg ${
                    theme === "dark" 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  Start a new conversation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatApp;