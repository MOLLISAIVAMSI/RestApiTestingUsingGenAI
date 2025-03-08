import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Carousel3D = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    const slides = [
      {
        title: "Code Compiler",
        image: "https://img.freepik.com/premium-photo/hands-typing-code-laptop-vibrant-city-setting-with-colorful-lights-background-represents-digital-world-coding-programming-modern-technology-urban-environment_210545-21000.jpg",
        path: "/CodeCompiler",
        content: "Compile and run your code online"
      },
      {
        title: "Test API",
        image: "https://www.centizen.com/wp-content/uploads/2020/06/REST-API.png",
        path: "/apitestingWebsite",
        content: "Test your API online"
      },
      {
        title: "Video Chat",
        image: "https://www.exitlag.com/blog/wp-content/uploads/2024/09/ExitLag-Internet-Network-How-It-Works-and-the-Key-Components.webp",
        path: "/NetworkVisualizer",
        content: "Visualize your network"
      }
    ];
  
    const moveLeft = () => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % slides.length);
    };
  
    const moveRight = () => {
      setActiveIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    };
    
    const goToSlide = (index) => {
      setActiveIndex(index);
    };

    const getSlideStyles = (index) => {
        const positions = {
          left: {
            transform: 'translateX(-80%) scale(0.5)',
            zIndex: 1,
            opacity: 0.8,
          },
          center: {
            transform: 'translateX(0%) scale(1.4)',
            zIndex: 2,
            opacity: 1,
          },
          right: {
            transform: 'translateX(80%) scale(0.5)',
            zIndex: 1,
            opacity: 0.8,
          },
        };

        const diff = (index - activeIndex + slides.length) % slides.length;
        if (diff === 0) return positions.center;
        if (diff === 1 || diff === -2) return positions.right;
        return positions.left;
    };

    return (
      <div className="relative w-full mx-auto h-96 overflow-hidden">
        <div className="relative h-full flex items-center justify-center">
        {slides.map((slide, index) => (
            <div
              key={index}
              className="absolute w-[600px] h-[400px] transition-all duration-500 ease-in-out cursor-pointer"
              style={{
                ...getSlideStyles(index),
                perspective: '1000px',
              }}
               onClick={() => {
                  const diff = (index - activeIndex + slides.length) % slides.length;
                  if (diff === 1 || diff === -2) moveLeft();
                  if (diff === 2 || diff === -1) moveRight();
               }}
            >
                <Link to={slide.path} className="relative block w-full h-full rounded-lg overflow-hidden shadow-xl">
                    <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <h3 className="text-white text-2xl font-bold">{slide.title}</h3>
                    </div>
                </Link>
          </div>
        ))}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {slides.map((_, index) => (
              <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-3 w-3 rounded-full transition-colors duration-300 ${index === activeIndex ? 'bg-white' : 'bg-gray-500 hover:bg-white/70'}`}
              />
            ))}
        </div>
        <button
            onClick={moveRight}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors z-10"
        >
            <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={moveLeft}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors z-10"
        >
        <ChevronRight className="w-6 h-6" />
      </button>
      <div>
        <Link to={slides[activeIndex].path} className="absolute bottom-10 left-1/2 -translate-x-1/2 p-2 px-4 bg-white/20 text-white rounded-full hover:bg-white/40 transition-colors z-10">
          {slides[activeIndex].content}
        </Link>
      </div>
    </div>
  );
};

export default Carousel3D;