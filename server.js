const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
require('dotenv').config();

const mongoose = require('mongoose');
const Models = require('./models');

const Movies = Models.Movie;
const Genres = Models.Genre;
const Directors = Models.Director;
const Users = Models.User;

mongoose.connect(process.env.CONNECTION_URI, 
{ useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(morgan('common'));

const cors = require('cors');
app.use(cors());

require('./auth')(app);
const passport = require('passport');
require('./passport');

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the myFlix API</h1>');
});

app.get('/users', passport.authenticate('jwt', { session: false }), async(req, res) => {
  try {
    const users = await Users.find();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: %s', error);
  }
});

app.get('/users/:Username', 
passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = Users.findOne({ username: req.params.Username });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

app.get('/users/:Username/favoriteMovies', 
passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = Users.findOne({ username: req.params.Username })
    res.status(200).json(user.favoriteMovies);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

app.put('/users/:Username', 
[
  check('username', 'Username is required').isLength({min: 3}),
  check('username', 
  'Username contains non-alphanumeric characters - not allowed').isAlphanumeric(),
  check('password', 'Password is required').not().isEmpty(),
  check('email', 'Email does not appear to be valid').isEmail(),
  check('birthday', 'Birthday must be in the date format').isDate()
], passport.authenticate('jwt', { session: false }), async (req, res) => {

  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const updatedUser = Users.findOneAndUpdate({ username: req.params.Username }, { $set: 
      {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        birthday: req.body.birthday
      }
    }, { new: true })
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

app.post('/users/:Username/movies/:MovieID', 
passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = Users.findOneAndUpdate({ username: req.params.Username }, {
      $push: { favoriteMovies: req.params.MovieID }
    }, { new: true })
    res.send('Movie ID: \"%s\" was added to %s\'s account', req.params.MovieID, updatedUser.username);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

app.post('/users',
[
  check('username', 'Username is required').isLength({min: 3}),
  check('username', 
  'Username contains non-alphanumeric characters - not allowed').isAlphanumeric(),
  check('password', 'Password is required').not().isEmpty(),
  check('email', 'Email does not appear to be valid').isEmail(),
  check('birthday', 'Birthday must be in the correct format (YYYY-MM-DD)').isDate({format: 'YYYY-MM-DD'})
], async (req, res) => {
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    let hashedPassword = Users.hashPassword(req.body.password);
    let user = await Users.findOne({ $or: [{ username: req.body.username }, 
                                          { email: req.body.email }] });
    if (user) {
      return res.status(400).send('An account already exists with that username or email');
    } else {
      let newUser = await Users.create({
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
        birthday: req.body.birthday
      });
      return res.status(201).send(newUser.username + '\'s account has been created');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  };
});

app.delete('/users/:Username/movies/:MovieID', 
passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = Users.findOneAndUpdate({ username: req.params.Username }, {
      $pull: { favoriteMovies: req.params.MovieID }
    }, { new: true });
    res.send('Movie ID: \"%s\" was removed from %s\'s account', req.params.MovieID, updatedUser.username);
  } catch(err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

app.delete('/users/:Username', 
passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = Users.findOneAndRemove({ username: req.params.Username })
    if(!user) {
      res.status(400).send(req.params.Username + '\'s account was not found.');
    } else {
      res.status(200).send(req.params.Username + '\'s account has been deleted.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

app.get('/movies', 
passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movies = Movies.find()
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

app.get("/movies/:Title", 
passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const title = Movies.findOne({ Title: req.params.Title });
    res.status(200).json(title);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

app.get("/genres/:Name", 
passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const genre = Genres.findOne({ Name: req.params.Name });
    res.status(200).json(genre);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

app.get("/directors/:Name", 
passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const director = Directors.findOne({ Name: req.params.Name });
    res.status(200).json(director);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

app.get("/movies/year/:ReleaseYear", 
passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const release_year = await Movies.find({ ReleaseYear: req.params.ReleaseYear});
    res.status(200).json(release_year);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).send('Something went wrong!');
});

const port = process.env.PORT || 8080
app.listen(port, '0.0.0.0', () => {
  console.log('Your app is listening on port ' + port);
});
