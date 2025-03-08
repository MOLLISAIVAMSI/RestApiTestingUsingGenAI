import React, { useEffect, useRef, useState } from 'react';
import Carousel3D from './Carousel3D';
import './style.css';
import imgpy from "../Resources/image.png";
const VantaGlobe = () => {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initVanta = async () => {
      if (!vantaEffect) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.dots.min.js');
        //https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js

        // Now that the scripts are loaded, VANTA should be available globally
        if (window.VANTA) {
          const effect = window.VANTA.DOTS({
            el: vantaRef.current,
            mouseControls: false,
            touchControls: false,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x204adb,
            color2: 0x412fb0,
            backgroundColor: 0x0,
            
          });
          setVantaEffect(effect);
        }
      }
    };

    initVanta();

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <div className='bg-black'>
    <div>
      <div className='flex items-center justify-center'
        ref={vantaRef}
        style={{
                  width: '100%',
                  height: '100vh',
                  position: 'relative'
                }}>
        <div className="container-fluid tracking-tight text-center text-blue-600 transition-colors duration-300 ">
          <p><i className="text-8xl bg-gradient-to-r from-purple-900 to-blue-700 font-bold p-3  text-transparent bg-clip-text">Kitten</i></p>
          <div>
            <p><i className="font-bold text-xl bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">An AI powerful sandbox testing which server all your needs under on app</i></p>
          </div>
        </div>
      </div>

      <div className="flex m-20 items-center justify-space-between  ">
        <img src={imgpy} className="rounded-lg w-[50%] h-[50%]"/>
        <div className="container w-1/2 text-center tracking-tight text-blue-600 transition-colors duration-300 ">
          <p><i className="text-5xl font-bold bg-gradient-to-r from-purple-900 to-blue-700 text-transparent bg-clip-text">Kitten</i></p><br/>
          <div>
            <p><i className="animate-pulse text-lg bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">An AI powerful sandbox testing which server all your needs under on app</i></p>
          </div>
        </div>
      </div>
      <div className="flex m-20 items-center justify-space-between ">
        <div className="container w-1/2 text-center tracking-tight text-blue-600 transition-colors duration-300 ">
          <p><i className="text-5xl font-bold bg-gradient-to-r from-purple-900 to-blue-700 text-transparent bg-clip-text">Kitten</i></p><br/>
          <div>
            <p><i className="animate-pulse text-lg bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">An AI powerful sandbox testing which server all your needs under on app</i></p>
          </div>
        </div>
        <img src={imgpy} className="rounded-lg w-[50%] h-[50%]"/>
      </div>
      </div>
    </div>
  );
};

export default VantaGlobe;