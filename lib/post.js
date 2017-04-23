const validate = require('./validate');

module.exports = (app, Model) => {
  const validateObj = validate(app);

  return obj => (
    validateObj(Model.inspector, obj)
      .then(() => {
        const model = new Model(obj);
        return model.save();
      })
  );
};
