// utils.js

function randomUsername() {
  const adjectives = ['Quick', 'Happy', 'Sly', 'Blue', 'Red'];
  const animals = ['Fox', 'Tiger', 'Panda', 'Eagle', 'Shark'];
  const num = Math.floor(Math.random() * 1000);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj}${animal}${num}`;
}

// Export the function
module.exports = { randomUsername };

