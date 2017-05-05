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
