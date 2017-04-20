const chai = require('chai');
const request = require('supertest');
const r2base = require('r2base');
const r2mongoose = require('r2mongoose');
const r2inspector = require('r2inspector');
const r2middleware = require('r2middleware');
const _ = require('underscore');
const api = require('../index');

const expect = chai.expect;
process.chdir(__dirname);

const app = r2base({ baseDir: __dirname });
app.start()
  .serve(r2middleware, ['bodyParser'])
  .serve(r2mongoose, { database: 'r2test' })
  .serve(r2inspector)
  .load('model')
  .serve(api, 'Test', { route: '/api/o/test', model: 'test', jwt: { secret: '1234', expiresIn: 7 } })
  .local('lib/error.js')
  .into(app);

const Test = app.service('Test');
// console.log(app.services);

const invalidObj = {
  slug: 123,
  email: 'test.com',
  user: 'abc',
  isEnabled: 'abc',
  createdAt: 'abc',
  workerCount: '10',
  arr1: ['abc'],
  arr2: ['abc'],
  arr3: ['abc'],
  numsArr1: [1000],
  numsArr2: [1000],
  'links.web': 'test.com',
  workers: ['a', 'b', 'c'],
  votes: [{
    user: 'a',
    type: 'b',
  }],
  testRef1: '58f5e1afc7e80f5a4ca7b74d',
};

const invalidObjTest = (errObj) => {
  expect(errObj.errors[0].reason).to.equal('optional');
  expect(errObj.errors[0].property).to.equal('@.name');
  expect(errObj.errors[1].reason).to.equal('pattern');
  expect(errObj.errors[1].property).to.equal('@.email');
  expect(errObj.errors[2].reason).to.equal('model');
  expect(errObj.errors[2].property).to.equal('@.user');
  expect(errObj.errors[3].reason).to.equal('eq');
  expect(errObj.errors[3].property).to.equal('@.isEnabled');
  expect(errObj.errors[4].reason).to.equal('type');
  expect(errObj.errors[4].property).to.equal('@.createdAt');
  expect(errObj.errors[5].reason).to.equal('pattern');
  expect(errObj.errors[5].property).to.equal('@.arr2[0]');
  expect(errObj.errors[6].reason).to.equal('minLength');
  expect(errObj.errors[6].property).to.equal('@.arr3');
  expect(errObj.errors[7].reason).to.equal('lte');
  expect(errObj.errors[7].property).to.equal('@.numsArr1[0]');
  expect(errObj.errors[8].reason).to.equal('pattern');
  expect(errObj.errors[8].property).to.equal('@["links.web"]');
  expect(errObj.errors[9].reason).to.equal('model');
  expect(errObj.errors[9].property).to.equal('@.workers[0]');
  expect(errObj.errors[10].reason).to.equal('model');
  expect(errObj.errors[10].property).to.equal('@.workers[1]');
  expect(errObj.errors[11].reason).to.equal('model');
  expect(errObj.errors[11].property).to.equal('@.workers[2]');
  expect(errObj.errors[12].reason).to.equal('minLength');
  expect(errObj.errors[12].property).to.equal('@.votes');
  expect(errObj.errors[13].reason).to.equal('model');
  expect(errObj.errors[13].property).to.equal('@.votes[0].user');
  expect(errObj.errors[14].reason).to.equal('eq');
  expect(errObj.errors[14].property).to.equal('@.votes[0].type');
};

const invalidObjUpdate = (errObj) => {
  expect(errObj.errors[0].reason).to.equal('pattern');
  expect(errObj.errors[0].property).to.equal('@.email');
  expect(errObj.errors[1].reason).to.equal('eq');
  expect(errObj.errors[1].property).to.equal('@.isEnabled');
  expect(errObj.errors[2].reason).to.equal('pattern');
  expect(errObj.errors[2].property).to.equal('@.arr2[0]');
  expect(errObj.errors[3].reason).to.equal('minLength');
  expect(errObj.errors[3].property).to.equal('@.arr3');
  expect(errObj.errors[4].reason).to.equal('lte');
  expect(errObj.errors[4].property).to.equal('@.numsArr1[0]');
  expect(errObj.errors[5].reason).to.equal('pattern');
  expect(errObj.errors[5].property).to.equal('@.links.web');
  expect(errObj.errors[6].reason).to.equal('minLength');
  expect(errObj.errors[6].property).to.equal('@.votes');
  expect(errObj.errors[7].reason).to.equal('eq');
  expect(errObj.errors[7].property).to.equal('@.votes[0].type');
  expect(errObj.errors[8].reason).to.equal('ref');
  expect(errObj.errors[8].property).to.equal('@.testRef1');
};

before((done) => {
  done();
});

describe('r2api', () => {
  describe('post', () => {
    it('should save object', () => (
      Test.post({ name: 'Project Title', slug: 'project-title' })
        .then((data) => {
          expect(data.name).to.equal('Project Title');
          expect(data.slug).to.equal('project-title');
        })
    ));

    it('should run validation', (done) => {
      Test.post({ name: 'Project Title 2', slug: 'project-title-2' })
        .then((data) => {
          Test.post(Object.assign(_.clone(invalidObj), { testRef2: data.id }))
            .then(done)
            .catch((err) => {
              try {
                expect(err.type).to.equal('validationError');
                invalidObjTest(err);
                expect(err.errors[15].reason).to.equal('ref');
                expect(err.errors[15].property).to.equal('@.testRef1');
                expect(err.errors[16]).to.equal(undefined); // existing id
                done();
              } catch (e) {
                done(e);
              }
            });
        });
    });
  });

  describe('get', () => {
    it('should get objects', () => (
      Test.post({ name: 'Project Title 3', slug: 'project-title-3' })
        .then(() => Test.get({ name: 'Project Title 3' }))
        .then((data) => {
          expect(data[0].name).to.equal('Project Title 3');
          expect(data[0].slug).to.equal('project-title-3');
        })
    ));

    it('should get object via id', () => (
      Test.post({ name: 'Project Title 4', slug: 'project-title-4' })
        .then(data => Test.getById(data.id))
        .then((data) => {
          expect(data.name).to.equal('Project Title 4');
          expect(data.slug).to.equal('project-title-4');
        })
    ));

    it('should not get object via invalid id', () => (
      Test.getById('58f79eb5e62eb71d7536ae49')
        .then((data) => {
          expect(data).to.equal(null);
        })
    ));
  });

  describe('put', () => {
    it('should update obj', (done) => {
      Test.post({ name: 'Project Title 5', slug: 'project-title-5' })
        .then(data => Test.put(data.id, { name: 'Project Title X' }))
        .then((data) => {
          expect(data.name).to.equal('Project Title X');
          expect(data.slug).to.equal('project-title-5');
          done();
        })
        .catch(done);
    });

    it('should not update via invalid object id', (done) => {
      Test.put('58f79eb5e62eb71d7536ae49')
        .then(done)
        .catch((err) => {
          expect(err.type).to.equal('notFound');
          done();
        });
    });

    it('should not update via invalid object', (done) => {
      Test.post({ name: 'Project Title A', slug: 'project-title-a' })
        .then(data => Test.put(data.id, Object.assign(_.clone(invalidObj), { links: { web: 'test2.com' } })))
        .catch((err) => {
          invalidObjUpdate(err);
          done();
        });
    });
  });

  describe('delete', () => {
    it('should delete obj', (done) => {
      Test.post({ name: 'Project Title 6', slug: 'project-title-6' })
        .then(data => Test.delete(data.id))
        .then((data) => {
          expect(data.result).to.deep.equal({ ok: 1, n: 1 });
          done();
        });
    });

    it('should not delete via invalid object id', (done) => {
      Test.put('58f79eb5e62eb71d7536ae49')
        .then(done)
        .catch((err) => {
          expect(err.type).to.equal('notFound');
          done();
        });
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
          expect(res.body.message.type).to.equal('validationError');
          invalidObjTest(res.body.message);
          done();
        });
    });

    it('GET /api/o/test should return 200 via object id', (done) => {
      Test.post({ name: 'Project Title 7', slug: 'project-title-7' })
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
      Test.post({ name: 'Project Title 8', slug: 'project-title-8' })
        .then(() => {
          request(app)
            .get('/api/o/test?slug=project-title-8')
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
      Test.post({ name: 'Project Title 9', slug: 'project-title-9' })
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
      Test.post({ name: 'Project Title B', slug: 'project-title-b' })
        .then((data) => {
          request(app)
            .put(`/api/o/test/${data.id}`)
            .send(Object.assign(_.clone(invalidObj), { links: { web: 'test2.com' } }))
            .expect(422)
            .end((err, res) => {
              invalidObjUpdate(res.body.message);
              done();
            });
        });
    });

    it('DELETE /api/o/test should return 204', (done) => {
      Test.post({ name: 'Project Title 10', slug: 'project-title-10' })
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

  describe('access token', () => {
    it('should verify access token', (done) => {
      const tokenData = {
        user: 'abc',
        expires: app.utils.expiresIn(3),
      };

      const token = app.utils.getToken(tokenData, '1234').token;
      Test.accessToken(token)
        .then((data) => {
          expect(data.user).to.equal('abc');
          expect(data.expires).to.not.equal(undefined);
          done();
        })
        .catch(done);
    });

    it('should not verify expired access token', (done) => {
      const tokenData = {
        user: 'abc',
        expires: app.utils.expiresIn(-3),
      };

      const token = app.utils.getToken(tokenData, '1234').token;
      Test.accessToken(token)
        .then(done)
        .catch((err) => {
          expect(err).to.equal('token expired!');
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
      Test.authMiddleware(req, res, () => {
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
      Test.authMiddleware(req, res, () => {
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
});

function dropDatabase(done) {
  this.timeout(0);
  app.service('Mongoose').connection.db.dropDatabase();
  done();
}

after(dropDatabase);
