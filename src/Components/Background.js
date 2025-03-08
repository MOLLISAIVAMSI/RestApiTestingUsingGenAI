import React, { useEffect, useRef, useState } from 'react';
import Carousel3D from './Carousel3D';
import './style.css';
import imgpy from "../Resources/image.png";
const Background = () => {
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
      <div className='flex items-center justify-center'
        ref={vantaRef}
        style={{
                  width: '100%',
                  height: '100vh',
                  position: 'relative'
                }}>
        
        </div>
    </div>
  );
};

export default Background;