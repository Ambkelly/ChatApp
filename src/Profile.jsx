import { useState } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";
import { updateProfile } from "firebase/auth";
export default function Profile() {
  const { user } = useAuth(); // Get the current user from AuthContext
  const [image, setImage] = useState(null); // State for the selected image file
  const [preview, setPreview] = useState(null); // State for the image preview
  const [name, setName] = useState(user?.displayName || ""); // State for the user's name

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file)); // Create a preview URL for the image
    }
  };

  // Upload image to Cloudinary and update profile
  const uploadImage = async () => {
    if (!image) return;

    
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "your_cloudinary_preset"); // Replace with your Cloudinary upload preset

    try {
      // Upload image to Cloudinary
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", // Replace with your Cloudinary cloud name
        formData
      );

      // Update Firebase profile with the new image URL
      await updateProfile(user, {
        photoURL: response.data.secure_url,
        displayName: name,
      });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold mb-4">Profile</h2>

      {/* Profile Picture */}
      <div className="mb-4">
        {preview ? (
          <img src={preview} alt="Profile Preview" className="w-24 h-24 rounded-full mx-auto" />
        ) : (
          user?.photoURL && (
            <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full mx-auto" />
          )
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mt-2"
        />
      </div>

      {/* Name Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      {/* Update Button */}
      <button
        onClick={uploadImage}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Update Profile
      </button>
    </div>
  );
}