const chai = require('chai');
const request = require('supertest');
const r2base = require('r2base');
const r2mongoose = require('r2mongoose');
const r2query = require('r2query');
const r2acl = require('r2acl');
const r2system = require('r2system');
const r2middleware = require('r2middleware');
const q = require('querymen');
const api = require('../index');

const expect = chai.expect;
process.chdir(__dirname);

const testMiddleware = (req, res, next) => {
  next();
};

const schema = new q.Schema({
  slug: String,
  qType: { type: String, enum: ['all', 'allTotal', 'one', 'total'] },
  limit: { type: Number, max: 100 },
  sort: '_id',
});

const app = r2base();
app.start()
  .serve(r2middleware)
  .serve(r2mongoose, { database: 'r2api' })
  .serve(r2query)
  .serve(r2acl)
  .serve(r2system)
  .load('model')
  .serve(api, 'TestApi', {
    route: '/api/o/test',
    model: 'test',
    beforeRoute: [testMiddleware],
    schema,
  })
  .local('lib/error.js')
  .into(app);

const TestApi = app.service('TestApi');
const Test = app.service('model/test');
const Acl = app.service('Acl');

const email = 'abc@test.com';
const invalidObj = {
  name: '',
  email: 'test.com',
  slug: '!123*=',
};

before((done) => {
  // wait for connection
  app.service('Mongoose').connection.on('open', () => {
    Acl.allow('guest', 'test', ['get', 'post', 'put', 'delete'])
      .then(() => Acl.addUserRoles('guest', 'guest'))
      .then(() => done())
      .catch(() => done());
  });
});

describe('r2api', () => {
  describe('instance', () => {
    it('should return instance without route and model', (done) => {
      const { authMiddleware, aclMiddleware, getRoute, postRoute, putRoute, deleteRoute } = api(app);
      expect(authMiddleware).to.not.equal(undefined);
      expect(aclMiddleware).to.not.equal(undefined);
      expect(getRoute).to.not.equal(undefined);
      expect(postRoute).to.not.equal(undefined);
      expect(putRoute).to.not.equal(undefined);
      expect(deleteRoute).to.not.equal(undefined);
      done();
    });
  });

  describe('endpoints', () => {
    before((done) => {
      request.agent(app.server);
      done();
    });

    it('POST /api/o/test should return 201', (done) => {
      request(app)
        .post('/api/o/test')
        .send({ name: 'test' }).expect(201)
        .end(done);
    });

    it('POST /api/o/test should return 422', (done) => {
      request(app)
        .post('/api/o/test')
        .send({}).expect(422)
        .end(done);
    });

    it('POST /api/o/test should return 422 via invalid obj', (done) => {
      request(app)
        .post('/api/o/test')
        .send(invalidObj).expect(422)
        .end((err, res) => {
          expect(res.body.name).to.equal('unprocessableEntity');
          expect(res.body.code).to.equal(422);
          expect(res.body.message.name).to.equal('ValidationError');
          expect(res.body.message.errors.name.message).to.equal('The Name field is required.');
          expect(res.body.message.errors.email.message).to.equal('The E-mail format is invalid.');
          expect(res.body.message.errors.slug.message).to.equal('The Slug field may only contain alpha-numeric characters, as well as dashes and underscores.');
          done();
        });
    });

    it('GET /api/o/test should return 200 via object id', (done) => {
      Test.create({ name: 'Project Title 7', slug: 'project-title-7' })
        .then((data) => {
          request(app)
            .get(`/api/o/test/${data.id}`)
            .expect(200)
            .end((err, res) => {
              expect(res.body.name).to.equal('ok');
              expect(res.body.code).to.equal(200);
              expect(res.body.data.name).to.equal('Project Title 7');
              expect(res.body.data.slug).to.equal('project-title-7');
              done();
            });
        });
    });

    it('GET /api/o/test should return 200 with object data', (done) => {
      Test.create({ name: 'Project Title 8', slug: 'project-title-8' })
        .then(() => {
          request(app)
            .get('/api/o/test?qType=all&slug=project-title-8')
            .expect(200)
            .end((err, res) => {
              expect(res.body.name).to.equal('ok');
              expect(res.body.code).to.equal(200);
              expect(res.body.data[0].name).to.equal('Project Title 8');
              expect(res.body.data[0].slug).to.equal('project-title-8');
              done();
            });
        });
    });

    it('GET /api/o/test should return 404 via invalid object id', (done) => {
      request(app)
        .get('/api/o/test/58f79eb5e62eb71d7536ae49')
        .expect(404)
        .end((err, res) => {
          expect(res.body.name).to.equal('notFound');
          expect(res.body.code).to.equal(404);
          done();
        });
    });

    it('PUT /api/o/test should return 200', (done) => {
      Test.create({ name: 'Project Title 9', slug: 'project-title-9' })
        .then((data) => {
          request(app)
            .put(`/api/o/test/${data.id}`)
            .send({ name: 'Project Title X' })
            .expect(200)
            .end((err, res) => {
              expect(res.body.name).to.equal('ok');
              expect(res.body.code).to.equal(200);
              expect(res.body.data.name).to.equal('Project Title X');
              expect(res.body.data.slug).to.equal('project-title-9');
              done();
            });
        });
    });

    it('PUT /api/o/test should return 404 via invalid object id', (done) => {
      request(app)
        .put('/api/o/test/58f79eb5e62eb71d7536ae49')
        .expect(404)
        .end((err, res) => {
          expect(res.body.name).to.equal('notFound');
          expect(res.body.code).to.equal(404);
          done();
        });
    });

    it('PUT /api/o/test should return 422 via invalid object', (done) => {
      Test.create({ name: 'Project Title B1', slug: 'project-title-b1' })
        .then((data) => {
          request(app)
            .put(`/api/o/test/${data.id}`)
            .send(invalidObj)
            .expect(422)
            .end((err, res) => {
              expect(res.body.message.errors.name.message).to.equal('The Name field is required.');
              expect(res.body.message.errors.email.message).to.equal('The E-mail format is invalid.');
              expect(res.body.message.errors.slug.message).to.equal('The Slug field may only contain alpha-numeric characters, as well as dashes and underscores.');
              done();
            });
        });
    });

    it('DELETE /api/o/test should return 204', (done) => {
      Test.create({ name: 'Project Title 10', slug: 'project-title-10' })
        .then((data) => {
          request(app)
            .delete(`/api/o/test/${data.id}`)
            .expect(204)
            .end(done);
        });
    });

    it('DELETE /api/o/test should return 404 via invalid object id', (done) => {
      request(app)
        .delete('/api/o/test/58f79eb5e62eb71d7536ae49')
        .expect(404)
        .end((err, res) => {
          expect(res.body.name).to.equal('notFound');
          expect(res.body.code).to.equal(404);
          done();
        });
    });
  });

  describe('auth middleware', () => {
    it('should return token data', (done) => {
      const tokenData = {
        user: 'abc',
        expires: app.utils.expiresIn(3),
      };

      const token = app.utils.getToken(tokenData, '1234').token;
      const req = { query: {}, headers: { 'x-access-token': token } };
      const res = {};
      TestApi.authMiddleware(req, res, () => {
        try {
          expect(req.tokenData.user).to.equal('abc');
          expect(req.tokenData.expires).to.not.equal(undefined);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should return guest user without access token', (done) => {
      const req = { query: {}, headers: {} };
      const res = {};
      TestApi.authMiddleware(req, res, () => {
        try {
          expect(req.tokenData).to.deep.equal({ user: 'guest' });
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('GET /api/o/test should return 401 via invalid token', (done) => {
      request(app)
        .get('/api/o/test')
        .set('x-access-token', 'invalid-token')
        .expect(401)
        .end((err, res) => {
          expect(res.body.name).to.equal('unauthorized');
          expect(res.body.code).to.equal(401);
          expect(res.body.message.type).to.equal('invalidToken');
          expect(res.body.message.errors[0]).to.equal('token verification failed!');
          done();
        });
    });
  });

  describe('acl middleware', () => {
    it('should return guest user acl data', (done) => {
      const req = { tokenData: { user: 'guest' }, method: 'get', query: {}, headers: {} };
      const res = {};
      TestApi.aclMiddleware('test')(req, res, () => {
        try {
          expect(req.aclData.test).to.not.equal(undefined);
          req.aclData.test.sort();
          expect(req.aclData.test).to.deep.equal(['delete', 'get', 'post', 'put']);
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe('api queries', () => {
    before((done) => {
      Test.create({ name: 'Project Title 1000', slug: 'params', num1: 1, num2: 200, isEnabled: 'n' })
        .then(() => Test.create({
          name: 'Project Title 1001', slug: 'params', num1: 2, num2: 404, isEnabled: 'y',
        }))
        .then(() => Test.create({
          name: 'Project Title 1002', slug: 'params', num1: 3, num2: 422, isEnabled: 'y',
        }))
        .then(() => Test.create({
          name: 'Project Title 1003', slug: 'params', num1: 4, num2: 200, isEnabled: 'n',
        }))
        .then(() => Test.create({
          name: 'Project Title 1004', slug: 'params', num1: 5, num2: 422, isEnabled: 'y',
        }))
        .then(() => done())
        .catch(() => done());
    });

    it('GET /api/o/test should return 200, query type = all', (done) => {
      Test.create({ name: 'Project Title 100', slug: 'project-title-100' })
        .then(() => {
          request(app)
            .get('/api/o/test?qType=all&slug=project-title-100')
            .expect(200)
            .end((err, res) => {
              expect(res.body.name).to.equal('ok');
              expect(res.body.code).to.equal(200);
              expect(res.body.data[0].name).to.equal('Project Title 100');
              expect(res.body.data[0].slug).to.equal('project-title-100');
              done();
            });
        });
    });

    it('GET /api/o/test should return 200, query type = allTotal', (done) => {
      Test.create({ name: 'Project Title 101', slug: 'project-title-101' })
        .then(() => {
          request(app)
            .get('/api/o/test?qType=allTotal&slug=project-title-101')
            .expect(200)
            .end((err, res) => {
              expect(res.body.name).to.equal('ok');
              expect(res.body.code).to.equal(200);
              expect(res.body.data.total).to.equal(1);
              expect(res.body.data.rows[0].name).to.equal('Project Title 101');
              expect(res.body.data.rows[0].slug).to.equal('project-title-101');
              done();
            });
        });
    });

    it('GET /api/o/test should return 200, query type = one', (done) => {
      Test.create({ name: 'Project Title 102', slug: 'project-title-102' })
        .then(() => {
          request(app)
            .get('/api/o/test?qType=one&slug=project-title-102')
            .expect(200)
            .end((err, res) => {
              expect(res.body.name).to.equal('ok');
              expect(res.body.code).to.equal(200);
              expect(res.body.data.name).to.equal('Project Title 102');
              expect(res.body.data.slug).to.equal('project-title-102');
              done();
            });
        });
    });

    it('GET /api/o/test should return 200, query type = total', (done) => {
      Test.create({ name: 'Project Title 103', slug: 'project-title-103' })
        .then(() => {
          request(app)
            .get('/api/o/test?qType=total&slug=project-title-103')
            .expect(200)
            .end((err, res) => {
              expect(res.body.name).to.equal('ok');
              expect(res.body.code).to.equal(200);
              expect(res.body.data).to.equal(1);
              done();
            });
        });
    });

    it('GET /api/o/test should return 400, query type = unknown', (done) => {
      request(app)
        .get('/api/o/test?qType=unknown&slug=project-title-100')
        .expect(400)
        .end((err, res) => {
          expect(res.body.name).to.equal('badRequest');
          expect(res.body.code).to.equal(400);
          expect(res.body.message.name).to.equal('queryError');
          expect(res.body.message.errors.message).to.equal('qType must be one of: all, allTotal, one, total');
          done();
        });
    });
  });
});

function dropDatabase(done) {
  this.timeout(0);
  app.service('Mongoose').connection.db.dropDatabase();
  done();
}

after(dropDatabase);
