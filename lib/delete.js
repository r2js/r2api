module.exports = (app, Model) => id => (
  Model.findOne({ _id: id })
    .then((data) => {
      if (!data) {
        return Promise.reject({ type: 'notFound' });
      }

      return Model.remove({ _id: id });
    })
);
