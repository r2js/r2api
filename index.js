const _ = require('underscore');
const libRoutes = require('./lib/routes');
const libAuthMiddleware = require('./lib/authMiddleware');
const libAclMiddleware = require('./lib/aclMiddleware');

module.exports = function Api(app, options) {
  if (!app.hasServices('Mongoose')) {
    return false;
  }

  const { route, model, jwt, beforeRoute = [] } = options;
  const mongoose = app.service('Mongoose');
  const Model = mongoose.model(model);
  const authMiddleware = libAuthMiddleware(app, jwt);
  const aclMiddleware = libAclMiddleware(app);
  const modelAcl = aclMiddleware(Model.modelName);

  // middleware stack
  const stack = [_, authMiddleware, modelAcl];
  Array.prototype.push.apply(stack, beforeRoute);

  const routes = ['get', 'post', 'put', 'delete'].reduce((acc, curr) => (
    Object.assign(acc, {
      [`${curr}Route`]: _.partial.apply(null, [app[curr]].concat(stack)).bind(app),
    })
  ), {});

  if (route) {
    libRoutes(app)(mongoose.model(model), route, routes);
  }

  return Object.assign({ authMiddleware, aclMiddleware }, routes);
};
