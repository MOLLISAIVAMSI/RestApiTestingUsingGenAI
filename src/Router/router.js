import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ApitestingWebsite from '../Components/ApitestingWebsite';
import App from '../App';
import CodeCompiler from '../Components/CodeCompiler';
import ListedReports from '../Components/ListedReports';
import VideoCall from '../Components/VideoCall';
import VantaGlobe from '../Components/VantaGlobe';
import NetworkVisualizer from '../Components/NetworkVisualizer';

const AppRoutes = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'apitestingWebsite',
        element: <ApitestingWebsite />,
      },
      {
        path: 'CodeCompiler',
        element: <CodeCompiler />,
      },
      {
        path: 'ListedReports',
        element: <ListedReports />,
      },
      {
        path: '/',
        element: <VantaGlobe />,
      },
      {
        path: 'VideoCall',
        element: <VideoCall />,
      },
      {
        path: 'NetworkVisualizer',
        element: <NetworkVisualizer />,
      }
    ],
  },
]);

export default AppRoutes;
