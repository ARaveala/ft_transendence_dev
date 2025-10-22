import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled, className }) => {
  return (
    <button
      className={`inline-flex items-center justify-center px-3 py-1 rounded text-white 
        ${disabled
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-blue-700 hover:bg-blue-800"}
        ${className}
        `}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
