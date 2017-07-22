const _ = require('underscore');

module.exports = (app) => {
  if (!app.hasServices('Query')) {
    return false;
  }

  const errors = require('./errors')(app); // eslint-disable-line
  const checkGetData = (data, res) => {
    if (!data) {
      return Promise.reject({ name: 'notFound' });
    }
    return app.handler.ok(data, res);
  };

  return (model, route, middlewares) => {
    const { getRoute, postRoute, putRoute, deleteRoute } = middlewares;

    getRoute(route, (req, res, next) => {
      model.apiQuery(req.query)
        .then(data => checkGetData(data, res))
        .catch(_.partial(errors, next));
    });

    getRoute(`${route}/:id`, (req, res, next) => {
      model.findOne(Object.assign({ _id: req.params.id }, req.condition || {}))
        .then(data => checkGetData(data, res))
        .catch(_.partial(errors, next));
    });

    postRoute(route, (req, res, next) => {
      model.create(req.body)
        .then(_.partial(app.handler.created, _, res))
        .catch(_.partial(errors, next));
    });

    putRoute(`${route}/:id`, (req, res, next) => {
      model.findOne(Object.assign({ _id: req.params.id }, req.condition || {}))
        .then((data) => {
          if (!data) {
            return Promise.reject({ name: 'notFound' });
          }

          Object.assign(data, req.body);
          return data.save();
        })
        .then(_.partial(app.handler.ok, _, res))
        .catch(_.partial(errors, next));
    });

    deleteRoute(`${route}/:id`, (req, res, next) => {
      const { id } = req.params;
      model.findOne(Object.assign({ _id: id }, req.condition || {}))
        .then((data) => {
          if (!data) {
            return Promise.reject({ name: 'notFound' });
          }

          return model.remove({ _id: id });
        })
        .then(_.partial(app.handler.noContent, _, res))
        .catch(_.partial(errors, next));
    });
  };
};
