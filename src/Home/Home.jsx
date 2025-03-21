import React from "react";
import Gif from "./GIf";
import { Link } from "react-router-dom";

const Home = () => {
  return (
   <>
    <div className="flex flex-col items-center justify-center mt-10">
    <div className="flex gap-4 items-center justify-center">
    <img src="Logo.png" alt="Logo" className="h-12 w-12" />
    <h1 className="text-white text-4xl font-bold">Welcome to Kelly Chat</h1>
  </div>
  </div>
    <Gif />
    <div className="flex justify-center gap-5 mt-10">
      <Link to="/home" className="bg-white py-2 px-10 rounded-full font-bold text-black">Login</Link>
      <Link to="/signup" className="bg-white py-2 px-10 rounded-full font-bold text-black">Register</Link>
    </div>
   </>
  );
};

export default Home;
