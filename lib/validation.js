const is = require('is_js');
const _ = require('underscore');

module.exports = app => (
  {
    objectId(schema, candidate, cb) {
      if (typeof candidate === 'undefined' || !schema.ref) {
        return cb();
      }

      let Model;
      try {
        Model = app.service('Mongoose').model(schema.ref);
      } catch (e) { } // eslint-disable-line

      if (!Model) {
        this.report('non existing model', null, 'model');
        return cb();
      }

      const items = (is.array(candidate)) ? candidate : [candidate];
      const condition = { _id: { $in: items } };

      return Model.count(condition, (err, count) => {
        const uniq = _.uniq(items);
        if (count !== uniq.length && candidate) {
          this.report('non existing id', null, 'ref');
        }

        cb();
      });
    },
  }
);
