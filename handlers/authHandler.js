const admin = require('firebase-admin');

// Import Firebase Client SDK (gunakan firebase-admin untuk token generation)
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const firebase = require('firebase/app');
const sendEmail = require('../services/emailService');

// Firebase Client SDK Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDIdYx3mGLxxuZeXz8cXhMew44g-0kQkf8",
    authDomain: "agresia-8d511.firebaseapp.com",
    projectId: "agresia-8d511",
    storageBucket: "agresia-8d511.firebasestorage.app",
    messagingSenderId: "679556135453",
    appId: "1:679556135453:web:863ad9fc854077caece4f4"
};

if (!firebase.getApps().length) {
    firebase.initializeApp(firebaseConfig);
}
// const auth = getAuth();
// console.log('Firebase initialized:', !!auth);
// const db = admin.firestore();










// Register User
const registerUser = async (request, h) => {
  const db = admin.firestore();
  const { email, password, displayName, phone, address } = request.payload;

  try {
    const user = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    function getRandomSixDigit() {
      return Math.floor(100000 + Math.random() * 900000);
    }

    let code = getRandomSixDigit();

    let link = process.env.BASE_URL;
    // const token = await admin.auth().createCustomToken(user.uid);
    // const tokenId = saveTokenToDatabase(token);
    link = link + "/verify/" + user.uid;
     // Kirim email verifikasi menggunakan layanan Fimail
     await sendEmail({
       fromName: 'Agrease Admin',
       fromAddress: 'irpansyah810@gmail.com',
       toName: displayName,
       toAddress: email,
       subject: 'Email Verification',
       content: `Hello ${displayName},\n\nPlease verify your email with the link:\n\n${link}\n\n  using the code:\n\n${code}\n\nThank you!\nAgrease Team`,
     });

    // Simpan data pengguna ke Firestore
    const userRef = db.collection('users-profile').doc(user.uid);

    await userRef.set({
      uid: user.uid,
      email: user.email,
      nama: user.displayName,
      phone: phone,
      address: address,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: 'buyer',
      isVerified: code // Menandakan apakah user sudah memverifikasi emailnya
   });

     // Buat link verifikasi email
    //  const verificationLink = await admin.auth().generateEmailVerificationLink(email);
    // let link = process.env.BASE_URL;
    // const token = await admin.auth().createCustomToken(user.uid);
    // const tokenId = saveTokenToDatabase(token);
    // link = link + "/verify/" + tokenId;

    
    return h.response({ success: true, message: 'User registered successfully', uid: user.uid }).code(201);
  } catch (error) {
    return h.response({ error: error.message }).code(400);
  }
};








// Login User
const loginUser = async (request, h) => {
  const db = admin.firestore();
  const { email, password } = request.payload;

  // Cek apakah sudah verifikasi atau belum
  const userRef = db.collection('users-profile');
  const doc = await userRef.where('email', '==', email).get();


  if (doc._size < 1) {
    console.log('Email Belum Terdaftar.');
    return h.response({ success: false, err: "Email Kamu Belum Terdaftar." }).code(404);
  }
  // console.log(doc);
  // Simpan data dalam variabel
  let userData = null;

  doc.forEach(d => {
    userData = {  ...d.data() }; // Gabungkan ID dokumen dengan data
  });
  // Mengambil data dari field tertentu
  // const userData = doc.data();
  const fieldValue = userData.isVerified;

  

  if (fieldValue === true) {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Generate custom token with Firebase Admin SDK
      // const token = await admin.auth().createCustomToken(user.uid);
  
      return h.response({ success: true, message: 'Login successful', data: userData }).code(200);
    } catch (error) {
      return h.response({success: false, error: error.message }).code(400);
    }

 }else {
    console.log('Email Belum Terverifikasi.');
    return h.response({ success: false, err: "Email Kamu Belum Terverifikasi." }).code(400);
 }

 
};





// Verify Token
const verifyToken = async (request, h) => {
  const db = admin.firestore();
  

  const { userid } = request.params;
  const {codeOTP} = request.payload;
  // const tokenBenar = await getTokenFromDatabase(token); // Mengambil token yang sesuai
  // console.log(tokenBenar);

  try {
    const userRef = db.collection('users-profile').doc(userid);
    const doc = await userRef.get();

    // Mengecek apakah dokumen ditemukan
    if (!doc.exists) {
      console.log('Data tidak ditemukan/Url Kamu Salah');
      return h.response({ success: false, err: "Data Tidak Ditemukan/Url Kamu Salah" }).code(404);
    }


       // Mengambil data dari field tertentu
       const userData = doc.data();
       const fieldValue = userData.isVerified;  // Ganti 'fieldName' dengan nama field yang ingin diperiksa
   
       // Melakukan pengecekan nilai field
       if (fieldValue === codeOTP) {
          try {
            // Jika OTP benar, update field 'isVerified' menjadi true
            await userRef.update({
              isVerified: true
            });
            console.log('Verifikasi berhasil dan field isVerified diperbarui!');
        
            return h.response({ success: true, message: "Verifikasi Berhasil!.", uid: userid }).code(200);
          } catch (error) {
            console.error('Error updating field: ', error);
            return h.response({ success: false, err: "Gagal memperbarui status verifikasi" }).code(500);
          }

       } else {
         console.log('Kode OTP salah');
         return h.response({ success: false, err: "Kode OTP kamu Salah." }).code(400);
       }
    // const decodedToken = await admin.auth().verifyIdToken(tokenBenar);
    // return h.response({ uid: decodedToken.uid, email: decodedToken.email }).code(200);
  } catch (error) {
    return h.response({ success: false, error: 'Invalid token' }).code(400);
  }
};




//menampilkan product
const getAllProducts = async (request, h) => {
  const db = admin.firestore();
    try {
      const productsSnapshot = await db.collection("products").get();
  
      if (productsSnapshot.empty) {
        return h.response({
          success: false,
          message: "No products found",
          data: [],
        }).code(404);
      }
  
      const products = [];
      productsSnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
  
      return h.response({
        success: true,
        message: "Products Data has been fetched successfully",
        data: products,
      }).code(200);
    } catch (error) {
      console.error("Error fetching products:", error);
      return h.response({
        success: false,
        message: "Internal server error",
      }).code(500);
    }
};



//get produk by ID
const getProductById = async (request, h) => {
  const db = admin.firestore();
  const { productId } = request.params;

  try {
    // Ambil data produk berdasarkan ID
    const productRef = db.collection("products").doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return h.response({
        success: false,
        message: `Product with ID ${productId} not found`,
      }).code(404);
    }

    const productData = { id: productDoc.id, ...productDoc.data() };

    return h.response({
      success: true,
      message: "Detail Product Data has been fetched successfully",
      data: productData,
    }).code(200);
  } catch (error) {
    console.error("Error fetching product:", error);
    return h.response({
      success: false,
      message: "Internal server error",
    }).code(500);
  }
};


//get product by category
const getProductsByCategory = async (request, h) => {
  const db = admin.firestore();
  const { category } = request.params; // Ambil kategori dari path parameter

  try {
    if (!category) {
      return h.response({
        success: false,
        message: "Category is required",
      }).code(400);
    }

    // Query Firestore untuk produk berdasarkan kategori
    const productsSnapshot = await db
      .collection("products")
      .where("category", "==", category)
      .get();

    if (productsSnapshot.empty) {
      return h.response({
        success: false,
        message: `No products found in category ${category}`,
        data: [],
      }).code(404);
    }

    // Map data produk ke array
    const products = [];
    productsSnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    return h.response({
      success: true,
      message: "Product Data by Category has been fetched successfully",
      data: products,
    }).code(200);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return h.response({
      success: false,
      message: "Internal server error",
    }).code(500);
  }
};



//menampilkan product by seller
const getProductsBySeller = async (request, h) => {
  const db = admin.firestore();
  const { sellerId } = request.params;

  try {
    // Query produk berdasarkan sellerId
    const productsSnapshot = await db
      .collection("products")
      .where("sellerId", "==", sellerId)
      .get();

    if (productsSnapshot.empty) {
      return h.response({
        success: false,
        message: `No products found for seller with ID ${sellerId}`,
        data: [],
      }).code(404);
    }

    // Map hasil query ke array
    const products = [];
    productsSnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    return h.response({
      success: true,
      message: "Product Data by Seller has been fetched successfully",
      data: products,
    }).code(200);
  } catch (error) {
    console.error("Error fetching products by seller:", error);
    return h.response({
      success: false,
      message: "Internal server error",
    }).code(500);
  }
};



//search product
const searchProducts = async (request, h) => {
  const db = admin.firestore();
  const { q } = request.query; // Ambil parameter 'q' dari URL

  // Validasi parameter query
  if (!q) {
    return h.response({
      success: false,
      message: "Search keyword is required",
    }).code(400);
  }

  try {
    // Ambil semua produk dari Firestore
    const productsSnapshot = await db.collection("products").get();

    if (productsSnapshot.empty) {
      return h.response({
        success: false,
        message: "No products found.",
        data: [],
      }).code(404);
    }

    // Filter produk yang memiliki nama mengandung kata kunci (case-insensitive)
    const products = [];
    productsSnapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      if (product.name.toLowerCase().includes(q.toLowerCase())) {
        products.push(product);
      }
    });

    if (products.length === 0) {
      return h.response({
        success: false,
        message: `No products found matching the search keyword '${q}'.`,
        data: [],
      }).code(404);
    }

    // Kirimkan hasil produk
    return h.response({
      success: true,
      message: "Product Data by Search has been fetched successfully",
      data: products,
    }).code(200);
  } catch (error) {
    console.error("Error fetching products:", error);
    return h.response({
      success: false,
      message: "Internal server error",
    }).code(500);
  }
};




//create product
const addProduct = async (request, h) => {
  const db = admin.firestore();
  const { image, price, name, description, stock } = request.payload;

  // Validasi field yang diperlukan
  if (!image || !price || !name || !description || !stock) {
    return h.response({
      success: false,
      message: "All fields (image, price, name, description, stock) are required",
    }).code(400);
  }

  try {
    // Data produk baru
    const newProduct = {
      image,
      price,
      name,
      description,
      stock,
      category,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Tambahkan timestamp
    };

    // Simpan produk baru ke Firestore
    const productRef = await db.collection("products").add(newProduct);

    // Kirimkan respons dengan data produk yang berhasil dibuat
    return h.response({
      success: true,
      message: "Product has been created successfully",
      data: { id: productRef.id, ...newProduct },
    }).code(201);
  } catch (error) {
    console.error("Error creating product:", error);
    return h.response({
      success: false,
      message: "Internal server error",
    }).code(500);
  }
};




//update product
const updateProduct = async (request, h) => {
  const db = admin.firestore();
  const { productId } = request.params;
  const { image, price, name, description, stock } = request.payload;

  // Validasi field yang diperlukan
  if (!image || !price || !name || !description || !stock) {
    return h.response({
      success: false,
      message: "All fields (image, price, name, description, stock) are required",
    }).code(400);
  }

  try {
    // Ambil referensi produk berdasarkan productId
    const productRef = db.collection("products").doc(productId);
    const productSnapshot = await productRef.get();

    if (!productSnapshot.exists) {
      return h.response({
        success: false,
        message: `Product with ID ${productId} not found`,
      }).code(404);
    }

    // Perbarui data produk
    const updatedProduct = {
      image,
      price,
      name,
      description,
      stock,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Tambahkan timestamp pembaruan
    };

    await productRef.update(updatedProduct);

    // Kirim respons sukses
    return h.response({
      success: true,
      message: "Product Data has been updated successfully",
      data: { id: productId, ...updatedProduct },
    }).code(200);
  } catch (error) {
    console.error("Error updating product:", error);
    return h.response({
      success: false,
      message: "Internal server error",
    }).code(500);
  }
};




//menghapus product
const deleteProduct = async (request, h) => {
  const db = admin.firestore();
  const { productId } = request.params;

  try {
    // Ambil referensi produk berdasarkan productId
    const productRef = db.collection("products").doc(productId);
    const productSnapshot = await productRef.get();

    if (!productSnapshot.exists) {
      return h.response({
        success: false,
        message: `Product with ID ${productId} not found`,
      }).code(404);
    }

    // Hapus produk dari Firestore
    await productRef.delete();

    // Kirim respons sukses
    return h.response({
      success: true,
      message: "Product Data has been deleted successfully",
      data: { id: productId },
    }).code(200);
  } catch (error) {
    console.error("Error deleting product:", error);
    return h.response({
      success: false,
      message: "Internal server error",
    }).code(500);
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getProductsBySeller,
  searchProducts,
  addProduct,
  updateProduct,
  deleteProduct
};
