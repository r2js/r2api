const libRoutes = require('./lib/routes');
const libAuthMiddleware = require('./lib/authMiddleware');
const libAclMiddleware = require('./lib/aclMiddleware');

module.exports = function Api(app, options) {
  if (!app.hasServices('Mongoose')) {
    return false;
  }

  const mongoose = app.service('Mongoose');
  const { route, model, jwt } = options;
  const authMiddleware = libAuthMiddleware(app, jwt);
  const aclMiddleware = libAclMiddleware(app);

  if (route) {
    libRoutes(app)(mongoose.model(model), route, {
      auth: authMiddleware,
      acl: aclMiddleware,
    });
  }

  return { authMiddleware, aclMiddleware };
};
