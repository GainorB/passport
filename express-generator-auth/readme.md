# Express Auth Step-by-Step

## Setup

Install the necessary dependencies.
- `passport` 
- `passport-local`
- `bcryptjs`
- `cookie-parser`
- `dotenv`
- `express-session`

## Create the User table.

In a new migration file in `db/migrations`:

```sql
# filename migration_[current-date].sql
\connect [your_database_here]

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  password TEXT NOT NULL
);
```

Then, run the migration: `psql -f migration_[date].sql`

## Set up your `.env` style and add it to your `.gitignore`.

In the root directory of your app, create a file `.env`. **IMMEDIATELY ADD IT TO YOUR GITIGNORE BEFORE YOU MAKE ANY OTHER CHANGES!!!!!!!**

In `.env`, write this line:

```
SECRET_KEY=lsdjflskjdflkjsdflsdjfoiwerjlksdjflsd
```

... except use a different secret key.

```bash
# You can generate a secret key using Python on the command line like so:
$ python
>>> import os
>>> os.urandom(24)
"\x02\xf3\xf7r\t\x9f\xee\xbbu\xb1\xe1\x90\xfe'\xab\xa6L6\xdd\x8d[\xccO\xfe"
# put this in your .env!
```

## Add the new dependencies to your `app.js`.

**Remember, don't copy and paste!!!!**

**STEP ONE**: Importing the new dependencies.

```js
// in app.js under requiring method override
const session = require('express-session');
const passport = require('passport');

// this will get our envorinment variables from the .env file
require('dotenv').config();
```

**STEP TWO**: Setting the app up to use our new middlewares!

```js
// in app.js under `app.use(methodOverride('_method'))`
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
```

## Add the views for logging in and registering.

Refer to [these files](./views/auth) to see how these should look.

## Create a User model.

**Step One**: In `models`, create a new file `user.js`.

It should look like this:

```js
const db = require('../db/config');

const User = {};

User.findByUserName = userName => {
  return db.oneOrNone('SELECT * FROM users WHERE username = $1', [userName]);
};

User.create = user => {
 return db.one(
    `
      INSERT INTO users
      (username, first_name, last_name, email, password)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `,
    [user.username, user.first_name, user.last_name, user.email, user.password]
  )
};

module.exports = User;
```

## Setting up Passport.

### auth directory

Create a 'services' directory in the root of your app, and an `auth` directory inside that.

Add the following files to the auth directory: `auth-helpers.js`, `local.js`, and `passport.js`.

### auth-helpers.js

This file will contain various helper functions that we use throughout our app. For now we are just going to add a function that will use bcrypt to compare passwords. Add the following code:

```javascript
const bcrypt = require('bcryptjs');
const User = require('../../models/user');


function comparePass(userPassword, databasePassword) {
  return bcrypt.compareSync(userPassword, databasePassword);
}
```

### passport.js

Add the following code:

```javascript
const passport = require('passport');
const User = require('../../models/user');

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user.username);
  });
  
  passport.deserializeUser((username, done) => {
    User.findByUserName(username)
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        done(err, null);
      });
  });
};
```

### local.js

Add the following code:

```javascript
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const init = require('./passport');
const User = require('../../models/user');
const authHelpers = require('./auth-helpers');

const options = {};

init();

passport.use(
  new LocalStrategy(options, (username, password, done) => {
    User.findByUserName(username)
      .then(user => {
        if (!user) {
          return done(null, false);
        }
        if (!authHelpers.comparePass(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      })
      .catch(err => {
        console.log(err);
        return done(err);
      });
  })
);

module.exports = passport;
```



## Setting up our register, login, logout, & user routes

### GET /auth/register

Now lets add the ability to register users. To do that we first need a registration form and a register route. In the routes directory, add `authRoutes.js`. Add the following code:

```javascript
const express = require('express');
const authRouter = express.Router();
const passport = require('../services/auth/local');
const authHelpers = require('../services/auth/auth-helpers');


authRouter.get('/login', authHelpers.loginRedirect, (req, res) => {
  res.render('auth/login');
});

authRouter.get('/register', authHelpers.loginRedirect, (req, res) => {
  res.render('auth/register');
});
```

Add this to `services/auth/authHelpers`:

```javascript
function loginRedirect(req, res, next) {
  if (req.user) res.redirect('/user');

  return next();
}
```



For now it will always `return next()`. Let's add our route to actually register the user!

### POST /auth/register

When the user posts to the `/auth/register` route, the browser will send all the data contained in the form field to our express server. Our route middleware will then create a new user with that data. Add the following code to the `routes/authRoutes.js` file:

```javascript
authRouter.post('/register', (req, res, next)  => {
  authHelpers.createNewUser(req, res)
  .then((user) => {
    req.login(user, (err) => {
      if (err) return next(err);

      res.redirect('/user');
    });
  })
  .catch((err) => { res.status(500).json({ status: 'error' }); });
});
```

The actual work of creating the user is offloaded to a function in our `auth-helpers` file. Let's add that code to that file:

```js
function createNewUser(req, res) {
  const salt = bcrypt.genSaltSync();
  const hash = bcrypt.hashSync(req.body.password, salt);
  return User.create({
    username: req.body.username,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: hash,
  });
}
```

Now that we can register users, let's give them the ability to log in.

### POST /auth/login

First we have to provide a page to log in. Add the following route to `routes/authRoutes`:

```javascript
authRouter.get('/login', authHelpers.loginRedirect, (req, res)=> {
  res.render('auth/login');
});
```

Passport makes this POST route handler pretty easy to write. Add the following code to `routes/authRoutes`:

```javascript
authRouter.post('/login', passport.authenticate('local', {
    successRedirect: '/user',
    failureRedirect: '/auth/login',
    failureFlash: true
  })
);
```

Passport authenticates the user for us based on the strategy we tell it to, in this case the local strategy. It authenticates according to the function in `auth/local.js`. Refer back to that to see what's going on there.

### GET /logout

Logging out is pretty straightforward. Add the following, again, to `routes/authRoutes`:

```javascript
authRouter.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = authRouter;
```

### GET /user

Now that users can log in, we'll give them a user profile page. Let's add the following code to `routes/users`:

```javascript
const express = require('express');
const userRoutes = express.Router();
const authHelpers = require('../services/auth/auth-helpers');

/* GET users listing. */

userRoutes.get('/', authHelpers.loginRequired, (req, res) => {
  res.json({ user: 'user profile page placeholder', userInfo: req.user });
});

module.exports = userRoutes;
```

We have a new auth helper method here. This, rather than redirecting logged in users, will redirect users that aren't logged in. We're protecting this route. Again, the auth helper is middleware. If the user isn't logged in, they get an error, if they are logged in, the helper function calls `next()` where, according to the route, they get redirected to a user profile page that includes their own user data, to be displayed. Add the following code to the `services/auth/auth-helpers` file:

```javascript
function loginRequired(req, res, next) {
  if (!req.user) res.redirect('/auth/login');

  return next();
}

module.exports = {
  comparePass,
  loginRedirect,
  loginRequired,
  createNewUser
}
```
