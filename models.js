const mongoose = require('mongoose');
let movieSchema = mongoose.Schema({
  Title: {type: String, required: true},
  Description: {type: String, required: true},
  Genre: {
    Name: String,
    Description: String
  },
  Director: {
    Name: String,
    Bio: String,
    Birth: Number
  },
  ReleaseYear: Number,
  Stars: [String],
  ImagePath: String,
  Featured: Boolean
});

let genreSchema = mongoose.Schema({
  Name: String,
  Description: String
});

let directorSchema = mongoose.Schema({
  Name: String,
  Bio: String
});

let userSchema = mongoose.Schema({
  username: {type: String, required: true},
  password: {type: String, required: true},
  Email: {type: String, required: true},
  Birthday: Date,
  favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});

let Movie = mongoose.model('Movie', movieSchema);
let Genre = mongoose.model('Genre', genreSchema);
let Director = mongoose.model('Director', directorSchema);
let User = mongoose.model('User', userSchema);

module.exports = { 
  Movie,
  Genre,
  Director,
  User
};