const _ = require('underscore');

module.exports = (app) => {
  const errors = require('./errors')(app); // eslint-disable-line
  const checkGetData = (data, res) => {
    if (!data) {
      return Promise.reject({ type: 'notFound' });
    }
    return app.handler.ok(data, res);
  };

  return (model, route, schema, middlewares) => {
    const { auth, acl } = middlewares;

    app.get(route, auth, acl(model), (req, res, next) => {
      schema.get(req.query)
        .then(data => checkGetData(data, res))
        .catch(_.partial(errors, next));
    });

    app.get(`${route}/:id`, auth, acl(model), (req, res, next) => {
      schema.getById(req.params.id)
        .then(data => checkGetData(data, res))
        .catch(_.partial(errors, next));
    });

    app.post(route, auth, acl(model), (req, res, next) => {
      schema.post(req.body)
        .then(_.partial(app.handler.created, _, res))
        .catch(_.partial(errors, next));
    });

    app.put(`${route}/:id`, auth, acl(model), (req, res, next) => {
      schema.put(req.params.id, req.body)
        .then(_.partial(app.handler.ok, _, res))
        .catch(_.partial(errors, next));
    });

    app.delete(`${route}/:id`, auth, acl(model), (req, res, next) => {
      schema.delete(req.params.id)
        .then(_.partial(app.handler.noContent, _, res))
        .catch(_.partial(errors, next));
    });
  };
};
