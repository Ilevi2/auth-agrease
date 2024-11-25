const authHandler = require('../handlers/authHandler');

const authRoutes = [
  {
    method: 'POST',
    path: '/register',
    handler: authHandler.registerUser,
  },
  {
    method: 'POST',
    path: '/login',
    handler: authHandler.loginUser,
  },
  {
    method: 'POST',
    path: '/verify/{userid}',
    handler: authHandler.verifyToken,
  },

  {
    method: 'GET',
    path: '/product',
    handler: authHandler.getAllProducts,
  },
  {
    method: 'GET',
    path: '/product/{productId}',
    handler: authHandler.getProductById,
  },
  {
    method: 'GET',
    path: '/product',
    handler: authHandler.getProductsByCategory,
  },
  {
    method: 'GET',
    path: '/product/seller/{sellerId}',
    handler: authHandler.getProductsBySeller,
  },
  {
    method: 'GET',
    path: '/product',
    handler: authHandler.searchProducts,
  },
  {
    method: 'POST',
    path: '/product',
    handler: authHandler.addProduct,
  },
  {
    method: 'PUT',
    path: '/product/{productId}',
    handler: authHandler.updateProduct,
  },
  {
    method: 'DELETE',
    path: '/product/{productId}',
    handler: authHandler.deleteProduct,
  },
];

module.exports = authRoutes;
