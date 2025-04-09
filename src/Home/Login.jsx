import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { auth, googleProvider } from "../firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle Email/Password Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/chat");
    } catch (error) {
      console.error("Error during sign-in:", error);
      alert(getFriendlyError(error.code));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/chat");
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      alert(getFriendlyError(error.code));
    } finally {
      setLoading(false);
    }
  };

  // Helper function for user-friendly error messages
  const getFriendlyError = (errorCode) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "No account found with this email address";
      case "auth/wrong-password":
        return "Incorrect password";
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/popup-closed-by-user":
        return "Sign in popup was closed";
      default:
        return "Sign in failed. Please try again.";
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0D0B1E]">
      {/* Left Side - Animation (Hidden on Small Screens) */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center">
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
          <img src="Logo.png" alt="Logo" className="h-12" />
        </div>
        <h1 className="text-white text-4xl font-bold">SIGN IN</h1>
        <p className="text-gray-400 mt-2">Sign in with email address</p>

        <form onSubmit={handleSignIn} className="mt-4 w-full max-w-md">
          <input
            type="email"
            placeholder="Yourname@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#1F1B39] text-white outline-none focus:ring-2 focus:ring-purple-500"
            required
          />

          <div className="relative mt-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#1F1B39] text-white outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 rounded-lg font-semibold hover:opacity-80 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="flex items-center justify-center mt-4 text-gray-400 w-full max-w-md">
          <hr className="w-1/3 border-gray-500" />
          <span className="mx-2">Or continue with</span>
          <hr className="w-1/3 border-gray-500" />
        </div>

        <div className="flex gap-4 mt-4 w-full max-w-md">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center bg-[#1F1B39] text-white py-3 rounded-lg font-semibold hover:opacity-80 disabled:opacity-50"
          >
            <img
              src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
              alt="Google"
              className="w-6 mr-2"
            />
            Google
          </button>

          <button
            disabled={true} // Disabled until Facebook auth is implemented
            className="w-full flex items-center justify-center bg-[#1F1B39] text-white py-3 rounded-lg font-semibold hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
  );
};

export default SignIn;