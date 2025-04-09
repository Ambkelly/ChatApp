// src/ChatRoom/ChatHeader.jsx
import { Sun, Moon, Phone, MoreVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { signOut, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const ChatHeader = ({ theme, toggleTheme, currentChat }) => {
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Extract name and initial from email
  const getEmailDetails = (email) => {
    if (!email) return { name: "Guest", initial: "G" };
    const [username] = email.split('@');
    const name = username.split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return {
      name,
      initial: username[0].toUpperCase()
    };
  };

  // Get current user data
  useEffect(() => {
    if (!auth.currentUser) return;

    const { name, initial } = getEmailDetails(auth.currentUser.email);
    
    // Set initial data from auth (prioritizing email-derived info)
    setUserData({
      displayName: name,
      photoURL: `https://ui-avatars.com/api/?name=${initial}&background=random`,
      lastSeen: new Date().toLocaleString()
    });

    // Listen for Firestore updates (will override if profile was updated)
    const userRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserData(prev => ({
          ...prev,
          ...doc.data(),
          lastSeen: doc.data().lastSeen?.toDate().toLocaleString() || new Date().toLocaleString()
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  // Typing indicator listener
  useEffect(() => {
    if (!currentChat?.conversationId) return;

    const typingRef = doc(db, "conversations", currentChat.conversationId, "typing", "status");
    const unsubscribe = onSnapshot(typingRef, (doc) => {
      const data = doc.data();
      if (data && data.userId !== auth.currentUser?.uid) {
        setIsTyping(data.isTyping);
        const timer = setTimeout(() => setIsTyping(false), 3000);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, [currentChat]);

  const handleUpdateProfile = async (newName, newPhoto) => {
    try {
      // Update Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: newName,
        photoURL: newPhoto
      });

      // Update Firestore
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: newName,
        photoURL: newPhoto,
        lastUpdated: new Date()
      });

      setUserData(prev => ({
        ...prev,
        displayName: newName,
        photoURL: newPhoto
      }));
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Get display name (fallback to email-derived name if no custom name set)
  const getDisplayName = () => {
    const { name } = getEmailDetails(auth.currentUser?.email);
    return userData?.displayName || name || "Guest";
  };

  // Get profile picture (fallback to email-derived initial if no custom photo set)
  const getProfilePicture = () => {
    const { initial } = getEmailDetails(auth.currentUser?.email);
    return userData?.photoURL || `https://ui-avatars.com/api/?name=${initial}&background=random`;
  };

  return (
    <div className={`flex justify-between items-center p-4 border-b relative ${
      theme === "dark" ? "bg-[#1E1E2F] border-gray-700" : "bg-white border-gray-300"
    }`}>
      <div className="flex items-center gap-2">
        <img
          src={getProfilePicture()}
          alt="avatar"
          className="rounded-full w-10 h-10"
          onError={(e) => {
            const { initial } = getEmailDetails(auth.currentUser?.email);
            e.target.src = `https://ui-avatars.com/api/?name=${initial}&background=random`;
          }}
        />
        <div>
          <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
            {getDisplayName()}
          </p>
          <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            {isTyping ? (
              <span className="text-green-500">Typing...</span>
            ) : (
              `Active now - ${new Date().toLocaleDateString()}`
            )}
          </p>
        </div>
      </div>
      <div className="flex gap-4 text-gray-500">
        <button onClick={toggleTheme} className="hover:text-gray-700">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="hover:text-gray-700">
          <Phone size={20} />
        </button>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="hover:text-gray-700"
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${
              theme === "dark" ? "bg-[#2D2D3D] border border-gray-700" : "bg-white border border-gray-200"
            }`}>
              <ProfileUpdateModal 
                theme={theme}
                currentName={getDisplayName()}
                currentPhoto={getProfilePicture()}
                onUpdate={handleUpdateProfile}
                onClose={() => setShowMenu(false)}
              />
              <button
                onClick={handleSignOut}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  theme === "dark" ? "text-red-400 hover:bg-[#3D3D4D]" : "text-red-600 hover:bg-gray-100"
                }`}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Profile Update Modal Component
const ProfileUpdateModal = ({ theme, currentName, currentPhoto, onUpdate, onClose }) => {
  const [name, setName] = useState(currentName || "");
  const [photo, setPhoto] = useState(currentPhoto || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    await onUpdate(name, photo);
    setIsUpdating(false);
    onClose();
  };

  return (
    <div className="p-2">
      <h3 className={`font-medium mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}>
        Update Profile
      </h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full p-2 mb-2 rounded ${
            theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100"
          }`}
          placeholder="Display Name"
          required
        />
        <input
          type="url"
          value={photo}
          onChange={(e) => setPhoto(e.target.value)}
          className={`w-full p-2 mb-2 rounded ${
            theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100"
          }`}
          placeholder="Profile Photo URL"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1 text-sm rounded ${
              theme === "dark" ? "bg-gray-600" : "bg-gray-200"
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className={`px-3 py-1 text-sm rounded text-white ${
              isUpdating ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isUpdating ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatHeader;