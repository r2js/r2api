const log = require('debug')('r2:api:accessToken');

module.exports = (app, jwtConf) => {
  const conf = jwtConf || app.config('jwt');
  if (!conf) {
    return log('jwt config not found!');
  }

  return token => (
    new Promise((resolve, reject) => {
      try {
        const decoded = app.utils.decodeToken(token, conf.secret);

        if (decoded.expires <= Date.now()) {
          return reject('token expired!');
        }

        return resolve(decoded);
      } catch (e) {
        return reject('token verification failed!');
      }
    })
  );
};
