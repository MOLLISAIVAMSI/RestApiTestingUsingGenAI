import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronDown } from 'lucide-react';
import img from "../Resources/Chachamaru_Anime.png";

const Top = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const menuItems = [
        { path: '/CodeCompiler', label: 'Code Compiler' },
        { path: '/apitestingWebsite', label: 'API Testing' },
        { path: '/ListedReports', label: 'Listed Reports' }
    ];

    const toggleServicesDropdown = () => {
        setIsServicesDropdownOpen(!isServicesDropdownOpen);
    };

     useEffect(() => {
        function handleClickOutside(event) {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsServicesDropdownOpen(false);
          }
        }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [dropdownRef]);


    return (
        <div className="w-full">
            <header className="bg-gradient-to-r from-purple-900 to-blue-700 text-white py-4 shadow-lg">
                <div className="container mx-auto flex justify-between items-center px-6">
                    <Link to="/" className="flex items-center" style={{marginLeft: "-20px"}}>
                      <img src={img} alt="Logo" className="h-12" />
                      <h1 className="text-5xl font-bold tracking-tight hover:text-purple-300 transition-colors duration-300" 
                        style={{ fontFamily: "Brush Script MT, cursive",marginLeft: "-15px",marginTop: "5px" }}
                      >
                      Kitten
                      </h1>
                    </Link>
                    <nav className="hidden md:block">
                        <ul className="flex items-center space-x-8">
                            <li>
                                <Link
                                    to="/"
                                    className="text-gray-300 hover:text-white hover:underline decoration-2 underline-offset-4 transition-all duration-200"
                                >
                                    Home
                                </Link>
                            </li>

                            <li className="relative" ref={dropdownRef}>
                                <button
                                    onClick={toggleServicesDropdown}
                                    className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors duration-200"
                                >
                                    <span>Services</span>
                                    <ChevronDown className={`w-4 h-4 ${isServicesDropdownOpen ? '-rotate-180' : ''} transition-transform duration-200`} />
                                </button>

                                <div className={`${isServicesDropdownOpen ? 'block' : 'hidden'} absolute left-0 mt-2 w-56 rounded-md shadow-lg`}>
                                    <div className="rounded-md ring-1 ring-black ring-opacity-5 py-1 bg-white">
                                        {menuItems.map((item) => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </li>
                            <li>
                                <Link
                                    to="/NetworkVisualizer"
                                    className="text-gray-300 hover:text-white hover:underline decoration-2 underline-offset-4 transition-all duration-200"
                                >
                                    NetworkVisualizer
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/documentation"
                                    className="text-gray-300 hover:text-white hover:underline decoration-2 underline-offset-4 transition-all duration-200"
                                >
                                    Documentation
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/contact"
                                    className="text-gray-300 hover:text-white hover:underline decoration-2 underline-offset-4 transition-all duration-200"
                                >
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden text-gray-300 hover:text-white transition-colors duration-200"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="md:hidden px-6 py-4 space-y-3 bg-gray-800">
                        <Link
                            to="/"
                            className="block text-gray-300 hover:text-white transition-colors duration-200"
                        >
                            Home
                        </Link>
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="block text-gray-300 hover:text-white transition-colors duration-200"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            to="/documentation"
                            className="block text-gray-300 hover:text-white transition-colors duration-200"
                        >
                            Documentation
                        </Link>
                        <Link
                            to="/contact"
                            className="block text-gray-300 hover:text-white transition-colors duration-200"
                        >
                            Contact
                        </Link>
                    </div>
                )}
            </header>
        </div>
    );
};

export default Top;