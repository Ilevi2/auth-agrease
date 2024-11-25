const admin = require('firebase-admin');

// Register User
const registerUser = async (request, h) => {
  const { email, password, displayName } = request.payload;

  try {
    const user = await admin.auth().createUser({
      email,
      password,
      displayName,
    });
    return h.response({ 
        message: 'User registered successfully', 
        uid: user.uid }).code(201);
  } catch (error) {
    return h.response({ error: error.message }).code(400);
  }
};

// Login User (Placeholder)
// const loginUser = async (request, h) => {
//   const { email, password } = request.payload;

//   try {
//     // Placeholder for Firebase Client SDK usage
//     return h.response({ 
//       success: true,
//       message: 'Login Successfully.'
//      }).code(501);
//   } catch (error) {
//     return h.response({ error: error.message }).code(400);
//   }
// };
const loginUser = async (request, h) => {
  const { email, password } = request.payload;

  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Generate custom token with Firebase Admin SDK
    const token = await admin.auth().createCustomToken(user.uid);

    return h.response({ success: true, message: 'Login successful', token }).code(200);
  } catch (error) {
    return h.response({ error: error.message }).code(400);
  }
};

// Verify Token
const verifyToken = async (request, h) => {
  const { token } = request.payload;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return h.response({ uid: decodedToken.uid, email: decodedToken.email }).code(200);
  } catch (error) {
    return h.response({ error: 'Invalid token' }).code(400);
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
};
