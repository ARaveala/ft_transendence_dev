import React, { useState } from "react";
import Button from "./Button";

// Props interface for the Modal component
interface ModalProps {
  isOpen: boolean;      // Controls whether the modal is visible
  onClose: () => void;  // Callback to close the modal
  onSubmit: (data: {
    username: string;
    password: string;
    twoFactor: boolean 
  }) => void;            // Callback to send the registration data to parent
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit }) => {
  // Local state to track form inputs
  const [username, setUsername] = useState("");            // Username input
  const [password, setPassword] = useState("");            // Password input
  const [enable2FA, setEnable2FA] = useState(false);       // 2FA checkbox
  const [error, setError] = useState("");                  // Validation error message

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  // Handles form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validates that username and password are provided
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    // Clears any previous errors
    setError("");

    // Calls parent's onSubmit callback with form data
    onSubmit({
      username,
      password,
      twoFactor: enable2FA,
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white text-black rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Register</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && <p className="text-red-500">{error}</p>}

          {/* Username input */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-2 border rounded"
            required
          />

          {/* Password input */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 border rounded"
            required
          />

           {/* 2FA checkbox */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enable2FA}
              onChange={(e) => setEnable2FA(e.target.checked)}
            />
            Enable 2FA via Email
          </label>

          {/* Submit and Close buttons */}
          <div className="flex justify-between items-center mt-4">
            <Button type="submit">Register</Button>
            <Button 
              type="button"
              onClick={onClose} 
              className="bg-red-500 hover:bg-red-600">
              Close
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;
