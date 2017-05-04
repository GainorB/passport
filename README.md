# Intro. to Express and Passport Local Authentication

- Authentication is the process of ensuring that a user is who they say they are.
- Authentication is the first line of defense that ensures that a user has valid credentials to access restricted content of the website or app.
- The most typical user authentication strategy is through a username/password or email/password combination.

### Objectives
1. Define authentication in the context of a web app.
2. Explain what Passport and Passport strategies are and how they fit into the Express framework.
3. Install Passport and set up a local authentication strategy.
4. Add authentication to Adaquotes.

## Sessions

- The session is an integral part of a web application.
- It allows data to be passed throughout the application through cookies that are stored on the browser and matched up to a server-side store.
- Usually sessions are used to hold information about the logged in status of users as well as other data that needs to be accessed throughout the app.
- We will be working with [express-session](https://github.com/expressjs/session) to enable sessions within our quotes app.

## Password Encryption

- When storing passwords in your database you **never** want to store plain text passwords. Ever.
- There are a variety of encryption methods available including MD5, SHA1, SHA2, and Blowfish.
- Check out this [video on password security](https://www.youtube.com/watch?v=7U-RbOKanYs)

## Using `bcrypt`

- `bcryptjs` is an NPM module that helps us create password hashes to save to our database.
- Let's check out [the documentation](https://www.npmjs.com/package/bcrypt) to learn how to implement this module.
- We will implement this together with [passport](https://www.passportjs.org/) to create an authentication strategy for our Express application.

# Implementing auth with passport

- Passport - Passport is authentication middleware for Node. It is designed to serve a singular purpose: authenticate requests. When writing modules, encapsulation is a virtue, so Passport delegates all other functionality to the application. This separation of concerns keeps code clean and maintainable, and makes Passport extremely easy to integrate into an application. -
  [Passport documentation](http://passportjs.org/docs/overview)

- Passport Strategy - Passport recognizes that each application has unique authentication requirements. Authentication mechanisms, known as strategies, are packaged as individual modules. Applications can choose which strategies to employ, without creating unnecessary dependencies. For example, there are separate strategies for GitHub logins, Facebook logins, etc. -
  [Passport documentation](http://passportjs.org/docs/overview)

## Steps to implement passport

1. First we need to add a users table to our database. Check the new migration for that in the `db/migrations` directory. Run the migration if you want to demo this app.

2. We also have to `npm install --save` a variety of new packages:
   - bcryptjs: the blowfish encryption package to encrypt and decrypt our passwords.
   - dotenv: this makes working with `.env` files easier.
   - express-session: to store our sessions on our express server.
   - cookie-parser: to parse cookies.
   - passport: express middleware to handle authentication.
   - passport-local: passport strategy to set the username/password login flow.

3. Next we have to add our `.env` file. We also add our `.env` file to our `.gitignore` so we don't push our secret keys to GitHub. Check the file to see what we added. The `SECRET_KEY` should just be a long string of jibberish.

4. Next, we have to add middleware and initialize a few packages inside our `app.js`.

5. We have to add some views, a place for people to register and to log in. Located in `views/auth`. **NOTE: inside the login and register forms, notice that the name for the username field is username and the name for the password is password. Passport uses these by default. DON'T CHANGE WHAT THESE ARE CALLED, OR IT WILL BREAK. I'VE SPENT HOURS AND HOURS DEBUGGING THIS NONSENSE**

6. The user model that we add for adding and selecting users into our database is fairly straightforward, let's take a look at that first.

7. Now we can look at the routes. We have a view `GETS`, for serving the login and register pages themselves, and a few `POSTS`, for registering and logging in. Registering adds the user to the database, and logging in requires getting the user info. and checking the password.

8. Next, we have our user controller. The one method in here creates a new user. It does some new stuff we haven't seen, namely encrypting a password. **NEVER STORE A PASSWORD IN PLAIN TEXT AS ITSELF. I WILL FIND YOU IF YOU DO.**

9. FINALLY, WE HAVE OUR SERVICES FOLDER. Woops, capslocks:

    - authHelpers: contains a function to compare passwords (this is where the database password is decrypted), and a function to require logins. The latter is a custom middleware that we wrote.
    - local.js: this is the strategy for allowing registration and log in with username/password combinations.
    - passport.js: this initializes passport for us. It provides functions for adding and retrieving user info. from the express session store.

## Some things to think about:

1. This one you should implement if you use auth. There should be a navigation bar or something. In the `ejs` it should conditionally render links according to whether or not the user is logged in. I.e., a signed in user does not need to see the register and log in link. A non-signed in user shouldn't see the user profile link.

2. We have **authentication** now, but a very naive version. Another thing we can add is **authorization**. The latter is how we would have different levels of access, like admins. How might you add that? You'd have to start by adding a column in the database.

3. What happens if someone logged in goes to the login or register page? We don't want that... how might we change it.

4. OAuth is what would allow us to have twitter and facebook logins. It also requires some more stuff in the database, and some additional passport strategies.

These things are post-post-post mvp. But if you want to give them a shot let me know.

# Step By Step

## Note: This step by step uses a different library for database management, it will look a little different from the pgpromise setup.

### auth directory

Create an auth directory in the root of your app

Add the following files to the auth directory: `auth-helpers.js`, `local.js`, and `passport.js`.

### auth-helpers.js

This file will contain various helper functions that we use throughout our app. For now we are just going to add a function that will use bcrypt to compare passwords. Add the following code:

```javascript
const bcrypt = require('bcryptjs');
// require your users model
const models = require('../db/models/index');


function comparePass(userPassword, databasePassword) {
  // bcrypt gives us access to this
  return bcrypt.compareSync(userPassword, databasePassword);
}
```

### passport.js

Add the following code:

```javascript
const passport = require('passport');
// require your users model
const models = require('../db/models/index');

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    // this may be a little different
    models.User.findById(id)
    .then((user) => { done(null, user); })
    .catch((err) => { done(err, null); });
  });
};
```

### local.js


```javascript
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const init = require('./passport');
// require your users model
const models = require('../db/models/index');
const authHelpers = require('../auth/auth-helpers');

const options = {};

init();

passport.use(new LocalStrategy(options, (username, password, done) => {
  // check to see if the username exists
  models.User.findOne({
    // this will definitely be different
    where: {
      username: username
    }
  })
  .then((user) => {
    console.log(user);
    if (!user) {
      return done(null, false);
    }
    if (!authHelpers.comparePass(password, user.dataValues.password)) {
      return done(null, false);
    } else {
      return done(null, user.dataValues);
    }
  })
  .catch((err) => { return done(err); });
}));

module.exports = passport;
```

```
git add -A
git commit -m "add passport config, local strategy, auth helpers"
```

### app.js

### app.js

First we're going to update `app.js` to include the passport middleware. We also need to include session middleware for express. Together these middleware will allow us to authenticate users using cookies. As long as the user is logged in, there will be an active user session in our express app for that user. When a logged in user makes requests, they send along some data from the cookie. The cookie is kinda like a key for the session.

Add the following code under the required modules (paste it in line 7) in `app.js`:

```javascript
const session = require('express-session');
const passport = require('passport');

const index = require('./routes/index');
const authRoutes = require('./routes/auth.js');
const userRoutes = require('./routes/user.js');
const app = express();

// load environment variables
require('dotenv').config();
```

We're adding the necessary modules and adding in some new routes we'll be creating. We also initialize dotenv. dotenv is a node module that makes it really easy to include environment variables in your app. We're doing this because our cookies require a secret key. Follow the directions in .env-sample to create your secret key. Make sure to .gitignore your new .env file! To add a .gitignore add a `.gitignore` file in the root of your project (next to app.js). In that file you can list files and directories for git to ignore. Add both `node_modules` and `.env`. `node_modules` takes up a ton of space so we dont wan't to put that in git and the .env file normally contains sensitive information, so we don't want that in git either.

We now need to tell express to use our express-session and passport middlewares. Directly underneath the second bodyParser middleware copy the following code:

```javascript
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
```

The final change we need to make to app.js is to update our routes. Add the following code after the list of application middleware:

```javascript
app.use('/', index);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
```

```
git add -A
git commit -m "add express-session, passport, new routes"
```

## Setting up our register, login, logout, & user routes

### GET /auth/register

Now lets add the ability to register users. To do that we first need a registration form and a register route. In the routes directory, add `auth.js`. Add the following code:

```javascript
const express = require('express');
const router = express.Router();

const authHelpers = require('../auth/auth-helpers');
const passport = require('../auth/local');

router.get('/register', authHelpers.loginRedirect, (req, res)=> {
  res.render('auth/register');
});
```

Make sure you set up the views for this route! Refer to the fazbook_auth lecture for guidance:

```javascript
function loginRedirect(req, res, next) {
  if (req.user) res.redirect('/user');

  return next();
}
```

For now it will always `return next()`. Let's add our route to actually register the user!

### POST /auth/register

When the user posts to the `/auth/register` route, the browser will send all the data contained in the form field to our express server. Our route middleware will then create a new user with that data. This route and the helper function have been refactored. Add the following code to the `routes/auth.js` file:

```javascript
router.post('/register', (req, res, next)  => {
  authHelpers.createUser(req, res)
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

```javascript
function createUser(req, res) {
  const salt = bcrypt.genSaltSync();
  const hash = bcrypt.hashSync(req.body.password, salt);

  return models.User.create({
    // this will be different -- something like INSERT INTO users(columns) VALUES(values)
    username: req.body.username,
    password: hash,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    dob: req.body.dob
  });
}
```

Now that we can register users, let's give them the ability to log in.

### POST /auth/login

First we have to provide a page to log in. Add the following route to `routes/auth`:

```javascript
router.get('/login', authHelpers.loginRedirect, (req, res)=> {
  res.render('auth/login');
});
```

The login ejs view has not been provided for you! Make sure you build that out.

Passport makes this POST route handler pretty easy to write. Add the following code to `routes/auth`:

```javascript
router.post('/login', passport.authenticate('local', {
    successRedirect: '/user',
    failureRedirect: '/auth/login',
    failureFlash: true
  })
);
```

Passport authenticates the user for us based on the strategy we tell it to, in this case the local strategy. It authenticates according to the function in `auth/local.js`. Refer back to that to see what's going on there.

### GET /logout

Logging out is pretty straightforward. Add the following, again, to `routes/auth`:

```javascript
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
```

```bash
git add -A
git commit -m "add auth routes"
```

### GET /user

Now that users can log in, we'll give them a user profile page. Let's add the following code to `routes/user`:

```javascript
router.get('/', authHelpers.loginRequired, (req, res, next) => {
  res.render('user/index', {
    user: req.user.dataValues
  });
});
```

We have a new auth helper method here. This, rather than redirecting logged in users, will redirect users that aren't logged in. We're protecting this route. Again, the auth helper is middleware. If the user isn't logged in, they get an error, if they are logged in, the helper function calls `next()` where, according to the route, they get redirected to a user profile page that includes their own user data, to be displayed. Add the following code to the `auth/auth-helpers` files:

```javascript
function loginRequired(req, res, next) {
  if (!req.user) res.redirect('/auth/login');

  return next();
}

module.exports = {
  comparePass,
  loginRedirect,
  loginRequired,
  createUser
}
```

```bash
git add -A
git commit -m "add user profile page route, loginRequired helper method"
```
