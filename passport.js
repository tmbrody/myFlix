const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, (username, password, done) => {
  Users.findOne({ username: username }, (error, user) => {
    if (error) {
      console.log(error);
      return done(error);
    }

    if (!user) {
      console.log('incorrect username');
      return done(null, false, {message: 'Incorrect username or password.'});
    }

    if (!user.validatePassword(password)) {
      console.log('incorrect password');
      return done(null, false, {message: 'Incorrect password.'});
    }

    console.log('finished');
    return done(null, user);
  });
}));

// authenticate users based on the JWT submitted alongside their request
passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt_secret'
}, async (jwtPaylod, done) => {
  try {
    const user = await Users.findById(jwtPaylod._id);
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));