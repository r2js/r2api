module.exports = (app, Model) => obj => (
  Model.find(obj)
);
