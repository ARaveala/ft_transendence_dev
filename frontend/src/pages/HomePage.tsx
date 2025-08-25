import React from "react";
import Button from "../components/ui/Button";

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">Welcome to Transcendence</h1>
      <p className="text-gray-300">This is a minimal landing page</p>
      <Button onClick={() => alert("Button clicked!")}>Click Me</Button>
    </div>
  );
};

export default HomePage;
