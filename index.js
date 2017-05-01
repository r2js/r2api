const routes = require('./lib/routes');
const authMiddleware = require('./lib/authMiddleware');
const aclMiddleware = require('./lib/aclMiddleware');
const log = require('debug')('r2:api');

module.exports = function Api(app, options) {
  const mongoose = app.service('Mongoose');
  if (!mongoose) {
    return log('service [Mongoose] not found!');
  }

  const { route, model, jwt } = options;
  const getAuthMiddleware = authMiddleware(app, jwt);
  const getAclMiddleware = aclMiddleware(app);

  if (route) {
    routes(app)(mongoose.model(model), route, {
      auth: getAuthMiddleware,
      acl: getAclMiddleware,
    });
  }

  return {
    authMiddleware: getAuthMiddleware,
    aclMiddleware: getAclMiddleware,
  };
};
