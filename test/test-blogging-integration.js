const chai = require('./chai');
const chaiHttp = require('./chai-http');
const faker = require('./faker');
const mongoose = require('./mongoose');

const should = chai.should();

const BlogPost = require('./models');
const {app, runServer, closeServer} = require('./server');
const TEST_DATABASE_URL = require('./config');

chai.use(chaiHttp);

// create a function to seed data
function seedPostData() {
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
      firstName: faker.Name.firstName,
      lastName: faker.Name.lastName
    },
    title: faker.Lorem.words,
    content: faker.Lorem.paragraph,
    created: Date.now
  };
}

// create a function that removes the db
function removePostData() {
  console.warn('Deleting Database');
  return mongoose.connection.dropDatabase();
}
