const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const BlogPost = require('../models');
const {app, runServer, closeServer} = require('../server');
const TEST_DATABASE_URL = require('../config');

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
    created: Date.now
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
      //    1. get back all restaurants returned by by GET request to `/restaurants`
      //    2. prove res has right status, data type
      //    3. prove the number of restaurants we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
      .get('/posts')
      .then(function(res) {
        res.status.should.be(200);
        res.body.posts.length.should.be.of.at.least(1);
        res.body.should.be.a('array');
        res.body.forEach(function(item) {
          item.should.be.a('object');
          item.should.have.all.keys(
            'id', 'title', 'author', 'content', 'created');
          item.author.should.have.all.keys(
            'firstName', 'lastName');
        });
        return BlogPost.count();
      })
      .then(function(count) {
        res.body.post.lenth.should.be(count);
      });
    });
  });
});
