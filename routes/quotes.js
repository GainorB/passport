const express = require('express');
const controller = require('../controllers/quotesController');
const authHelpers = require('../services/auth/authHelpers');

const quoteRoutes = express.Router();

quoteRoutes.get('/', controller.index);
quoteRoutes.get('/add', authHelpers.loginRequired, (req, res) => {
  res.render('quotes/quotes-add', {
    documentTitle: 'Adaquote!',
  });
});
quoteRoutes.get('/edit/:id', authHelpers.loginRequired, controller.edit);
quoteRoutes.get('/:id', controller.show);
quoteRoutes.post('/', authHelpers.loginRequired, controller.create);
quoteRoutes.put('/:id', authHelpers.loginRequired, controller.update);
quoteRoutes.delete('/:id', authHelpers.loginRequired, controller.destroy);

module.exports = quoteRoutes;
