const routes = require('./lib/routes');
const validate = require('./lib/validate');
const accessToken = require('./lib/accessToken');
const authMiddleware = require('./lib/authMiddleware');
const aclMiddleware = require('./lib/aclMiddleware');
const log = require('debug')('r2:api');

module.exports = function Api(app, options) {
  const mongoose = app.service('Mongoose');
  if (!mongoose) {
    return log('service [Mongoose] not found!');
  }

  const { route, model, jwt } = options;
  const getModel = mongoose.model(model);
  const schema = ['get', 'getById', 'post', 'put', 'delete'].reduce((acc, val) => (
    Object.assign(acc, {
      [val]: require(`./lib/${val}`)(app, getModel)  // eslint-disable-line
    })
  ), {});

  const getAccessToken = accessToken(app, jwt);
  const getAuthMiddleware = authMiddleware(app, getAccessToken);
  const getAclMiddleware = aclMiddleware(app);

  if (route) {
    routes(app)(model, route, schema, {
      auth: getAuthMiddleware,
      acl: getAclMiddleware,
    });
  }

  return {
    accessToken: getAccessToken,
    authMiddleware: getAuthMiddleware,
    aclMiddleware: getAclMiddleware,
    get: schema.get,
    getById: schema.getById,
    post: schema.post,
    put: schema.put,
    delete: schema.delete,
    validate: validate(app),
  };
};
