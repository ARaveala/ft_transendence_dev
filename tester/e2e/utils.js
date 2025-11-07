// utils.js

function randomUsername() {
  const adjectives = ['Fast', 'Gray', 'Sly', 'Blue', 'Red'];
  const animals = ['Fox', 'Bat', 'Bear', 'Bird', 'Fish'];
  const num = Math.floor(Math.random() * 1000);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj}${animal}${num}`;
}

// Randomizes n amount of unique usernames
function randomizeNUsernames(n) {
    let arr = [];
    for (let i = 0; i < n; ++i) {
        let new_username = randomUsername();
        while (arr.includes(new_username)) {
            new_username = randomUsername();
        }
        arr.push(new_username);
    }
    return arr;
}

// Export the function
module.exports = { randomUsername, randomizeNUsernames };

