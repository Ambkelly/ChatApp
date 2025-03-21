import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase"; // Import Firebase auth and provider
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Handle Email/Password Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User created:", userCredential.user);
      navigate("/chat"); // Redirect to chat page after signup
    } catch (error) {
      console.error("Error during signup:", error.message);
      alert(error.message); // Show error message to the user
    }
  };

  // Handle Google Signup
  const handleGoogleSignup = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      console.log("Google signup successful:", userCredential.user);
      navigate("/chat"); // Redirect to chat page after signup
    } catch (error) {
      console.error("Error during Google signup:", error.message);
      alert(error.message); // Show error message to the user
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row items-center justify-center bg-gray-100">
      {/* Left Side (Image Section) */}
      <div className="hidden md:flex md:w-1/2 h-full">
        <img
          src="Image.png" // Update with correct path
          alt="Creative Design"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Side (Form Section) */}
      <div className="flex items-center justify-center w-full md:w-1/2 p-8">
        <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center">
            <span className="text-4xl">🚀</span>
          </div>

          <h2 className="text-2xl font-bold text-center mt-4">
            Create an account
          </h2>

          {/* Google Signup Button */}
          <button
            onClick={handleGoogleSignup}
            className="flex items-center justify-center w-full py-3 mt-4 border rounded-lg shadow-sm text-gray-700 font-medium hover:bg-gray-100 transition"
          >
            <img
              src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Create account with Google
          </button>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <hr className="w-full border-gray-300" />
            <span className="px-3 text-gray-500">Or</span>
            <hr className="w-full border-gray-300" />
          </div>

          {/* Form Fields */}
          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">
                Password
              </label>
              <input
                type="password"
                placeholder="Create your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition"
            >
              Create an account
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-500 mt-4">
            Already have an account?{" "}
            <Link to="/home" className="text-purple-600 hover:underline">
              Login
            </Link>
          </p>

          {/* Social Icons */}
          <div className="flex justify-center mt-4 space-x-4 text-gray-500">
            <a href="#" className="hover:text-gray-700">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#" className="hover:text-gray-700">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="hover:text-gray-700">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="hover:text-gray-700">
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;