import React from "react";
import { useAuth } from "../context/AuthContext";

const Friends: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Friends Page</h1>
      {user ? (
        <p>Welcome, {user.username}! Here are your friends:</p>
      ) : (
        <p>Please log in to see your friends.</p>
      )}
    </div>
  );
};

export default Friends;