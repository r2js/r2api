const _ = require('underscore');
const log = require('debug')('r2:api:routes');

module.exports = (app) => {
  const query = app.service('Query');
  if (!query) {
    return log('service [Query] not found!');
  }

  const errors = require('./errors')(app); // eslint-disable-line
  const checkGetData = (data, res) => {
    if (!data) {
      return Promise.reject({ name: 'notFound' });
    }
    return app.handler.ok(data, res);
  };

  return (model, route, middlewares) => {
    const { auth, acl } = middlewares;
    const modelName = model.modelName;

    app.get(route, auth, acl(modelName), (req, res, next) => {
      model.apiQuery(req.query)
        .then(data => checkGetData(data, res))
        .catch(_.partial(errors, next));
    });

    app.get(`${route}/:id`, auth, acl(modelName), (req, res, next) => {
      model.findOne({ _id: req.params.id })
        .then(data => checkGetData(data, res))
        .catch(_.partial(errors, next));
    });

    app.post(route, auth, acl(modelName), (req, res, next) => {
      model.saveNew(req.body)
        .then(_.partial(app.handler.created, _, res))
        .catch(_.partial(errors, next));
    });

    app.put(`${route}/:id`, auth, acl(modelName), (req, res, next) => {
      model.findOne({ _id: req.params.id })
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

    app.delete(`${route}/:id`, auth, acl(modelName), (req, res, next) => {
      const { id } = req.params;
      model.findOne({ _id: id })
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
