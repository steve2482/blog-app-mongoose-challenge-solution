const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

// create a function to seed data
function seedPostData() {
  console.log('Seeding blog post data');
  const seedData = [];
  for (let i = 1; i <= 10; i++) {
    seedData.push(generatePost());
  }
  return BlogPost.insertMany(seedData);
}

// create a function that creates a random post
function generatePost() {
  return {
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    },
    title: faker.lorem.words(),
    content: faker.lorem.paragraph(),
    created: Date.now()
  };
}

// create a function that removes the db
function removePostData() {
  console.warn('Deleting Database');
  return mongoose.connection.dropDatabase();
}

describe('API Endpoints', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });
  beforeEach(function() {
    return seedPostData();
  });
  afterEach(function() {
    return removePostData();
  });
  after(function() {
    return closeServer();
  });

  describe('GET request', function() {
    it('Should get and return all posts', function() {
      // strategy:
      //    1. get back all posts returned by by GET request to `/posts`
      //    2. prove res has right status, data type
      //    3. prove the number of posts we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
      .get('/posts')
      .then(function(_res) {
        res = _res;
        res.should.have.status(200);
        res.body.length.should.be.of.at.least(1);
        return BlogPost.count();
      })
      .then(function(count) {
        res.body.should.have.length.of(count);
      });
    });

    it('Should return blogposts with right fields', function() {
    // Strategy: Get back all posts, and ensure they have expected keys
      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.forEach(function(post) {
            post.should.be.a('object');
            post.should.include.keys(
              'id', 'title', 'content', 'author', 'created');
          });
          resPost = res.body[0];
          return BlogPost.findById(resPost.id);
        })
        .then(function(post) {
          resPost.id.should.equal(post.id);
          resPost.title.should.equal(post.title);
          resPost.content.should.equal(post.content);
          resPost.author.should.contain(post.author.firstName);
          resPost.author.should.contain(post.author.lastName);
        });
    });
  });

  describe('POST Endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the post we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('Should add a new post', function() {
      const newPost = generatePost();
      return chai.request(app)
        .post('/posts')
        .send(newPost)
        .then(function(res) {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'title', 'content', 'author', 'created');
          res.body.id.should.not.be.null;
          res.body.title.should.equal(newPost.title);
          res.body.content.should.equal(newPost.content);
          res.body.author.should.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
          return BlogPost.findById(res.body.id);
        })
        .then(function(post) {
          post.title.should.equal(newPost.title);
          post.content.should.equal(newPost.content);
          post.author.firstName.should.equal(newPost.author.firstName);
          post.author.lastName.should.equal(newPost.author.lastName);
        });
    });
  });

  describe('PUT Endpoint', function() {
    // strategy:
    //  1. Get an existing post from db
    //  2. Make a PUT request to update that post
    //  3. Prove post returned by request contains data we sent
    //  4. Prove post in db is correctly updated
    it('Should update an existing post', function() {
      const updateData = {
        title: 'updated title',
        content: 'content has been changed'
      };
      return BlogPost
        .findOne()
        .exec()
        .then(function(post) {
          updateData.id = post.id;
          return chai.request(app)
            .put('/posts/${post.id}')
            .send(updateData);
        })
        .then(function(res) {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.title.should.equal(updateData.title);
          res.body.content.should.equal(updateData.content);
          return BlogPost.findById(updateData.id);
        })
        .then(function(post) {
          post.title.should.equal(updateData.title);
          post.body.content.should.equal(updateData.content);
        });
    });
  });
});
