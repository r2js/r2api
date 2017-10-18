const _ = require('underscore');
const log = require('debug')('r2:api');
const libRoutes = require('./lib/routes');
const libAuthMiddleware = require('./lib/authMiddleware');
const libAclMiddleware = require('./lib/aclMiddleware');

module.exports = function Api(app, options = {}) {
  if (!app.hasServices('Mongoose')) {
    return false;
  }

  const { route, model, aclName, jwt, beforeRoute = [] } = options;
  const jwtConfig = jwt || app.config('jwt');
  if (!jwtConfig) {
    return log('jwt config not found!');
  }

  const mongoose = app.service('Mongoose');
  const authMiddleware = libAuthMiddleware(app, jwtConfig);
  const aclMiddleware = libAclMiddleware(app);
  const stack = [_, authMiddleware]; // middleware stack
  let aclInstance;

  let acl = aclName;
  if (model) {
    const Model = mongoose.model(model);
    acl = Model.modelName;
  }

  if (acl) {
    aclInstance = aclMiddleware(acl);
    stack.push(aclInstance);
  }

  // apply beforeRoute
  Array.prototype.push.apply(stack, beforeRoute);

  const routes = ['get', 'post', 'put', 'delete'].reduce((acc, curr) => {
    const copyStack = [...stack];
    return Object.assign(acc, {
      [`${curr}Route`]: _.partial.apply(null, [app[curr]].concat(copyStack)).bind(app),
    });
  }, {});

  if (route && model) {
    libRoutes(app)(mongoose.model(model), route, routes, options);
  }

  return Object.assign({ authMiddleware, aclMiddleware }, routes);
};
