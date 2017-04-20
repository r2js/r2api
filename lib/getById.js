module.exports = (app, Model) => id => (
  Model.findOne({ _id: id })
);
