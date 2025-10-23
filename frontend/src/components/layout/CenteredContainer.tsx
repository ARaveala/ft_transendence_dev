import React from 'react';

// This wrapper handles the full vertical space and centers the content.
const CenteredContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col justify-center items-center h-full w-full">
        {/* ... children are vertically centered ... */}
      {children}
    </div>
  );
};

export default CenteredContainer;