const bcrypt = require('bcryptjs');

// Hash a password
const password = 'matthewantony122';

// Salt rounds (10 is a common default value)
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hashedPassword) {
  if (err) {
    console.error(err);
  } else {
    console.log('Hashed Password:', hashedPassword);
  }
});
