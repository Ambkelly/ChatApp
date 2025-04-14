import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChatApp from "./ChatRoom/Chat"; // Correct import
import "./index.css";
import Home from "./Home/Home";
import Login from "./Home/Login";
import Signup from "./Home/SignUp";
import ChatHeader from "./ChatRoom/ChatHeader"; 

// Wrapper to combine ChatHeader and ChatApp
const ChatPage = () => (
  <>
    <ChatHeader />
    <ChatApp />
  </>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}
