import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { auth, googleProvider } from "../firebase"; // Import Firebase auth and provider
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Handle Email/Password Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User signed in:", userCredential.user);
      navigate("/chat"); // Redirect to chat page after sign-in
    } catch (error) {
      console.error("Error during sign-in:", error.message);
      alert(error.message); // Show error message to the user
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in successful:", userCredential.user);
      navigate("/chat"); // Redirect to chat page after sign-in
    } catch (error) {
      console.error("Error during Google sign-in:", error.message);
      alert(error.message); // Show error message to the user
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0D0B1E]">
      {/* Left Side - Animation (Hidden on Small Screens) */}
      <div className="md:w-1/2 flex items-center justify-center md:flex">
        <DotLottieReact
          src="https://lottie.host/cbabc315-51e5-4e01-9d49-c22b17a2a9c2/096sR9Ohi2.lottie"
          loop
          autoplay
          className="w-full max-w-lg h-full"
        />
      </div>

      {/* Right Side - Sign In Form */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-8">
      <div className="py-10">
        <img src="Logo.png" alt="Logo" srcset="" />
      </div>
        <h1 className="text-white text-4xl font-bold">SIGN IN</h1>
        <p className="text-gray-400 mt-2">Sign in with email address</p>

        <div className="mt-4 w-full max-w-md">
          <input
            type="email"
            placeholder="Yourname@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#1F1B39] text-white outline-none focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mt-4 rounded-lg bg-[#1F1B39] text-white outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            onClick={handleSignIn}
            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 rounded-lg font-semibold hover:opacity-80"
          >
            Sign In
          </button>

          <div className="flex items-center justify-center mt-4 text-gray-400">
            <hr className="w-1/3 border-gray-500" />
            <span className="mx-2">Or continue with</span>
            <hr className="w-1/3 border-gray-500" />
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center bg-[#1F1B39] text-white py-3 rounded-lg font-semibold hover:opacity-80"
            >
              <img
                src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
                alt="Google"
                className="w-6 mr-2"
              />
              Google
            </button>

            <button className="w-full flex items-center justify-center bg-[#1F1B39] text-white py-3 rounded-lg font-semibold hover:opacity-80">
              <img src="facebook.png" alt="Facebook" className="w-6 mr-2" />
              Facebook
            </button>
          </div>

          <p className="text-gray-400 mt-4 text-center">
            By registering, you agree to our{" "}
            <span className="text-purple-400">Terms and Conditions</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;