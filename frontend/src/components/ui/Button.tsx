import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return (
    <button
      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
