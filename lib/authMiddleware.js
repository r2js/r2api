module.exports = (app, conf) => (
  (req, res, next) => {
    const token = req.headers['x-access-token'];

    if (!token) {
      req.tokenData = { user: 'guest' };
      return next();
    }

    return app.utils.accessToken(token, conf)
      .then((data) => {
        req.tokenData = data;
        next();
      })
      .catch((err) => {
        next(app.handler.unauthorized({
          type: 'invalidToken',
          errors: [err],
        }));
      });
  }
);
