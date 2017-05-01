module.exports = app => (
  (next, err) => {
    const { name, errors } = err;

    if (name === 'ValidationError') {
      return next(app.handler.unprocessableEntity({ name, errors }));
    } else if (name === 'notFound') {
      return next(app.handler.notFound());
    }

    return next(app.handler.internalServerError());
  }
);
