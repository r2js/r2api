const validate = require('./validate');

module.exports = (app, Model) => {
  const Validate = validate(app);

  return obj => (
    Validate(Model.inspector, obj)
      .then(() => {
        const model = new Model(obj);
        return model.save();
      })
  );
};
