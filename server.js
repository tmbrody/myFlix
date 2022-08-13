const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');

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

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');


app.get('/', (req, res) => {
  res.send('<h1>Welcome to the myFlix API</h1>');
});

app.get('/users', 
passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/users/:Username', 
passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/users/:Username/favoriteMovies', 
passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ username: req.params.Username })
  .then((user) => {
    res.json(user.favoriteMovies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

app.put('/users/:Username', 
[
  check('username', 
  'username contains non-alphanumeric characters - not allowed').isAlphanumeric(),
  check('Email', 'Email does not appear to be valid').isEmail()
], passport.authenticate('jwt', { session: false }), (req, res) => {
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  Users.findOneAndUpdate({ username: req.params.Username }, { $set: 
    {
      username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true })
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  })
});

app.post('/users/:Username/movies/:MovieID', 
passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ username: req.params.Username }, {
    $push: { favoriteMovies: req.params.MovieID }
  },
  { new: true })
  .then((updatedUser) => {
    res.send('Movie ID: \"' + req.params.MovieID + '\" was added to ' 
    + updatedUser.username + '\'s account');
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  })
});

app.post('/users',
[
  check('username', 'Username is required').isLength({min: 3}),
  check('username', 
  'Username contains non-alphanumeric characters - not allowed').isAlphanumeric(),
  check('password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], (req, res) => {
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.password);
  Users.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.username + ' already exists');
      } else {
        Users
          .create({
            username: req.body.username,
            password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) => { res.status(201).send(user.username + '\'s account has been created') })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.delete('/users/:Username/movies/:MovieID', 
passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ username: req.params.Username }, {
    $pull: { favoriteMovies: req.params.MovieID }
  },
  { new: true })
  .then((updatedUser) => {
    res.send('Movie ID: \"' + req.params.MovieID + '\" was removed from ' 
    + updatedUser.username + '\'s account');
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  })
});

app.delete('/users/:Username', 
passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({ username: req.params.Username })
  .then((user) => {
    if(!user) {
      res.status(400).send(req.params.Username + '\'s account was not found.');
    } else {
      res.status(200).send(req.params.Username + '\'s account has been deleted.');
    }
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

app.get('/movies', 
passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
  .then((movies) => {
    res.status(201).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

app.get("/movies/:Title", 
passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ Title: req.params.Title })
  .then((title) => {
    res.json(title);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

app.get("/genres/:Name", 
passport.authenticate('jwt', { session: false }), (req, res) => {
  Genres.findOne({ Name: req.params.Name })
  .then((genre) => {
    res.json(genre);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

app.get("/directors/:Name", 
passport.authenticate('jwt', { session: false }), (req, res) => {
  Directors.findOne({ Name: req.params.Name })
  .then((director) => {
    res.json(director);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

app.get("/movies/year/:ReleaseYear", 
passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find({ ReleaseYear: req.params.ReleaseYear})
  .then((ReleaseYear) => {
    res.json(ReleaseYear);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).send('Something went wrong!');
});

const port = process.env.PORT || 8080
app.listen(port, '0.0.0.0', () => {
  console.log('Your app is listening on port ' + port);
});
