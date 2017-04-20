module.exports = app => (
  (next, err) => {
    const { type, errors } = err;

    if (type === 'validationError') {
      return next(app.handler.unprocessableEntity({ type, errors }));
    } else if (type === 'notFound') {
      return next(app.handler.notFound());
    }

    return next(app.handler.internalServerError());
  }
);
