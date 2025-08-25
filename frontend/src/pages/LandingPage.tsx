import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";

const HomePage: React.FC = () => {
  // State to track if the registration modal is open
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  //Handles submission of registration form from the Modal
  const handleRegister = async (data: {
    username: string;
    password: string;
    twoFactor: boolean;
  }) => {
    try {
      // Sends POST request to backend registration endpoint
      const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      // Throws error if backend response is not OK
      if (!res.ok) throw new Error("Failed to register");

      // Success: notifies user and closes the modal
      alert("Registration successful!");
      setIsModalOpen(false);
      navigate("/profile"); // Redirect user to profile page after registration
    } catch (err) {
      // Handles errors such as validation failures
      alert(err);
    }
  };

  return (
    // Layout for homepage
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      
      {/* Main logo / title */}
      <h1 className="text-4xl font-bold">Pong</h1>
      
      {/* Button to open registration modal */}
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => setIsModalOpen(true)}
      >
        Sign In
      </button>

      {/* Modal component for registering a new player */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} // Callback to close modal
        onSubmit={handleRegister}             // Callback to handle form submission
      />
    </div>
  );
};

export default HomePage;
