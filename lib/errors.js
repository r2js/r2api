module.exports = (app) => {
  const { unprocessableEntity, notFound, internalServerError } = app.handler;

  return (next, err) => {
    console.log(err);
    const { name, message, errors } = err;
    const errObj = { name, errors };
    const nameToLower = name.toLowerCase();

    if (nameToLower === 'validationerror') {
      return next(unprocessableEntity(errObj));
    } else if (nameToLower === 'notfound') {
      return next(notFound(message));
    }

    return next(internalServerError(errObj));
  };
};
