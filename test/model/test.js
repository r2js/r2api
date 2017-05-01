module.exports = (app) => {
  const { Validate } = app.service('System');
  const mongoose = app.service('Mongoose');
  const query = app.service('Query');
  const { Schema } = mongoose;

  const schema = new Schema({
    name: { type: String },
    email: { type: String },
    slug: { type: String },
    num1: { type: Number },
    num2: { type: Number },
    isEnabled: { type: String, enum: ['y', 'n'] },
  });

  const attributes = {
    en: {
      name: 'Name',
      email: 'E-mail',
      slug: 'Slug',
    },
  };

  const rules = {
    name: 'required|min:4',
    email: 'email',
    slug: 'alpha_dash',
  };

  Validate(schema, { attributes, rules });
  schema.plugin(query.plugin);
  const model = mongoose.model('test', schema);
  return model;
};
