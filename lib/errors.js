module.exports = (app) => {
  const { unprocessableEntity, notFound, internalServerError, badRequest } = app.handler;

  return (next, err) => {
    const { name, message, type, errors } = err;
    const errObj = { name, message, type, errors };
    const nameToLower = name ? name.toLowerCase() : '';

    if (nameToLower === 'validationerror') {
      return next(unprocessableEntity(errObj));
    } else if (nameToLower === 'notfound') {
      return next(notFound(message));
    } else if (nameToLower === 'queryerror') {
      return next(badRequest(errObj));
    }

    return next(internalServerError(errObj));
  };
};
