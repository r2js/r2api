const inspector = require('schema-inspector');

module.exports = (app) => {
  const validation = require('./validation')(app); // eslint-disable-line
  const sanitization = require('./sanitization')(app); // eslint-disable-line

  return (schema, obj) => (
    new Promise((resolve, reject) => {
      inspector.sanitize(schema, obj, sanitization, () => {
        inspector.validate(schema, obj, validation, (err, result) => {
          if (err) {
            return reject(err);
          }

          if (result && result.error && result.error.length) {
            return reject({ type: 'validationError', errors: result.error });
          }

          return resolve();
        });
      });
    })
  );
};
