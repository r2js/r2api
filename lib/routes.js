const _ = require('underscore');

module.exports = (app) => {
  if (!app.hasServices('Query')) {
    return false;
  }

  const { partial: p } = _;
  const { ok, created, noContent } = app.handler;
  const errors = require('./errors')(app); // eslint-disable-line
  const checkGetData = (data, res) => {
    if (!data) {
      return Promise.reject({ name: 'notFound' });
    }
    return ok(data, res);
  };

  const findOne = (model, id, condition) => (
    model.findOne(Object.assign({ _id: id }, condition || {}))
  );

  return (model, route, routes, options) => {
    const { getRoute, postRoute, putRoute, deleteRoute } = routes;
    const { schema } = options;

    getRoute(route, (req, res, next) => {
      if (!schema || typeof schema !== 'function') {
        return p(errors, next)({ name: 'queryError', errors: 'query schema not found!' });
      }

      const apiSchema = schema();
      return apiSchema.validate(req.query, (err) => {
        if (err) {
          return p(errors, next)({ name: 'queryError', errors: err });
        }

        const {
          query, select, cursor: { sort, limit, skip, populate },
        } = apiSchema.parse(req.query);

        return model.apiQuery(query, { sort, limit, skip, populate, fields: select })
          .then(data => checkGetData(data, res))
          .catch(p(errors, next));
      });
    });

    getRoute(`${route}/:id`, (req, res, next) => {
      findOne(model, req.params.id, req.condition)
        .then(data => checkGetData(data, res))
        .catch(p(errors, next));
    });

    postRoute(route, (req, res, next) => {
      model.create(req.body)
        .then(p(created, _, res))
        .catch(p(errors, next));
    });

    putRoute(`${route}/:id`, (req, res, next) => {
      findOne(model, req.params.id, req.condition)
        .then((data) => {
          if (!data) {
            return Promise.reject({ name: 'notFound' });
          }

          Object.assign(data, req.body);
          return data.save();
        })
        .then(p(ok, _, res))
        .catch(p(errors, next));
    });

    deleteRoute(`${route}/:id`, (req, res, next) => {
      const { id } = req.params;
      findOne(model, id, req.condition)
        .then((data) => {
          if (!data) {
            return Promise.reject({ name: 'notFound' });
          }

          return model.remove({ _id: id });
        })
        .then(p(noContent, _, res))
        .catch(p(errors, next));
    });
  };
};
