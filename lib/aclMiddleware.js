const _ = require('underscore');

module.exports = (app) => {
  if (!app.hasServices('Acl')) {
    return false;
  }

  const acl = app.service('Acl');
  const reply = (next, forbidden, data) => next(forbidden(data));

  return object => (
    (req, res, next) => {
      const tokenData = req.tokenData;
      const forbidden = _.partial(reply, next, app.handler.forbidden, _);

      if (!tokenData) {
        return forbidden({ type: 'invalidTokenData' });
      }

      const method = req.method.toLowerCase();

      return acl.allowedPermissions(tokenData.user, [object], (err, aclData) => {
        if (err || !aclData[object]) {
          return forbidden({ type: 'aclObjectNotFound' });
        }

        if (!aclData[object].includes(method)) {
          return forbidden({ type: 'aclMethodNotFound' });
        }

        req.aclData = aclData;
        return next();
      });
    }
  );
};
