const validate = require('./validate');
const _ = require('underscore');

module.exports = (app, Model) => {
  const Validate = validate(app);

  return (id, obj) => {
    let modelData;
    return Model.findOne({ _id: id })
      .then((data) => {
        if (!data) {
          return Promise.reject({ type: 'notFound' });
        }

        modelData = data;
        Object.assign(modelData, obj);
        return Validate(Model.inspector, _.omit(modelData.toJSON(), _.isEmpty));
      })
      .then(() => modelData.save());
  };
};
