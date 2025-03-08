import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Top from './Components/Top';
import Bottom from './Components/Bottom';
import ChatBot from './Components/ChatBot';
import './App.css'
import VantaGlobe from './Components/VantaGlobe';

const App = () => {
  return (
    <div className="min-h-screen flex flex-col hide-scrollbar">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 w-full">
        <Top />
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-black">
        <Outlet />
      </div>

      {/* Footer */}
     

      {/* ChatBot - Fixed position handled within component */}
      <ChatBot/>
      <div>
        <Bottom />
      </div>
    </div>
  );
};

export default App;