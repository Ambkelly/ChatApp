import { Sun, Moon, Phone, Video, MoreVertical, Check, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { signOut, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const ChatHeader = ({ theme, toggleTheme, user, currentChat, isTyping }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const getEmailDetails = (email) => {
    if (!email) return { name: "Guest", initial: "G" };
    const [username] = email.split('@');
    const name = username.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    return { name, initial: username[0].toUpperCase() };
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const { name, initial } = getEmailDetails(auth.currentUser.email);

    setUserData({
      displayName: auth.currentUser.displayName || name,
      photoURL: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${initial}&background=random`,
      lastSeen: new Date().toLocaleString()
    });

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

  useEffect(() => {
    if (!currentChat || !user) return;

    const otherUserId = currentChat.user1Id === user.uid ? currentChat.user2Id : currentChat.user1Id;
    const userRef = doc(db, "users", otherUserId);

    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setOtherUser({
          id: doc.id,
          ...doc.data(),
          lastSeen: doc.data().status === 'online' 
            ? "Online" 
            : doc.data().lastSeen?.toDate().toLocaleString() || "Recently"
        });
      }
    });

    return () => unsubscribe();
  }, [currentChat, user]);

  const handleUpdateProfile = async (newName, newPhoto) => {
    try {
      await updateProfile(auth.currentUser, {
        displayName: newName,
        photoURL: newPhoto
      });

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: newName,
        photoURL: newPhoto,
        lastUpdated: serverTimestamp()
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
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          status: 'offline',
          lastSeen: serverTimestamp()
        });
      }

      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getOtherUserName = () => {
    if (!currentChat || !user) return "Chat";
    
    return currentChat.user1Id === user.uid 
      ? (currentChat.user2Name || otherUser?.displayName || "User") 
      : (currentChat.user1Name || otherUser?.displayName || "User");
  };

  const getOtherUserPhoto = () => {
    if (!currentChat || !user) return null;
    
    return currentChat.user1Id === user.uid 
      ? (currentChat.user2Photo || otherUser?.photoURL) 
      : (currentChat.user1Photo || otherUser?.photoURL);
  };

  return (
    <>
      <div className={`flex justify-between items-center p-3 border-b ${
        theme === "dark" ? "bg-[#1E1E2F] border-gray-700" : "bg-teal-600 border-teal-700"
      }`}>
        <div className="flex items-center gap-3">
          <button className="md:hidden text-white">
            <ArrowLeft size={20} />
          </button>
          <img
            src={getOtherUserPhoto() || `https://ui-avatars.com/api/?name=${getOtherUserName()[0]}&background=random`}
            alt="avatar"
            className="rounded-full w-10 h-10"
            onError={(e) => {
              const initial = getOtherUserName()[0] || 'U';
              e.target.src = `https://ui-avatars.com/api/?name=${initial}&background=random`;
            }}
          />
          <div>
            <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-white"}`}>
              {getOtherUserName()}
            </p>
            <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-200"}`}>
              {isTyping ? (
                <span className="text-green-300">typing...</span>
              ) : otherUser ? (
                otherUser.status === 'online' ? "Online" : `Last seen ${otherUser.lastSeen}`
              ) : (
                "WhatsApp user"
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-white">
          <button className="hover:bg-white/10 p-2 rounded-full">
            <Video size={20} />
          </button>
          <button className="hover:bg-white/10 p-2 rounded-full">
            <Phone size={20} />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="hover:bg-white/10 p-2 rounded-full">
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 z-50 ${
                theme === "dark" ? "bg-[#2D2D3D] border border-gray-700" : "bg-white border border-gray-200"
              }`}>
                <button
                  onClick={toggleTheme}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    theme === "dark" ? "text-white hover:bg-[#3D3D4D]" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
                <button
                  onClick={() => {
                    setShowModal(true);
                    setShowMenu(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    theme === "dark" ? "text-white hover:bg-[#3D3D4D]" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Update Profile
                </button>
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

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`rounded-lg shadow-lg p-4 w-full max-w-sm ${
            theme === "dark" ? "bg-[#2D2D3D] text-white" : "bg-white text-black"
          }`}>
            <ProfileUpdateModal
              theme={theme}
              currentName={userData?.displayName || ""}
              currentPhoto={userData?.photoURL || ""}
              onUpdate={handleUpdateProfile}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

const ProfileUpdateModal = ({ theme, currentName, currentPhoto, onUpdate, onClose }) => {
  const [name, setName] = useState(currentName || "");
  const [photo, setPhoto] = useState(currentPhoto || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a display name");
      return;
    }
    
    setIsUpdating(true);
    await onUpdate(name, photo);
    setIsUpdating(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="font-semibold mb-3 text-lg">Update Profile</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Display Name"
        className={`w-full p-2 mb-2 rounded ${
          theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100"
        }`}
      />
      <input
        type="text"
        value={photo}
        onChange={(e) => setPhoto(e.target.value)}
        placeholder="Photo URL"
        className={`w-full p-2 mb-4 rounded ${
          theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100"
        }`}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className={`px-3 py-1 rounded ${
            theme === "dark" ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUpdating}
          className={`px-3 py-1 rounded ${
            theme === "dark" ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"
          } text-white`}
        >
          {isUpdating ? "Updating..." : "Update"}
        </button>
      </div>
    </form>
  );
};

export default ChatHeader;