const db = require('../db/config');

const Quote = {};

Quote.findAll = () => {
  return db.query('SELECT * FROM quotes ORDER BY id ASC');
};

Quote.findById = id => {
  return db.oneOrNone('SELECT * FROM quotes WHERE id = $1', [id]);
};

Quote.create = quote => {
  return db.one(
    `
      INSERT INTO quotes
      (content, author, genre_id)
      VALUES ($1, $2, $3) RETURNING *
    `,
    [quote.content, quote.author, quote.genre_id]
  );
};

Quote.update = (quote, id) => {
  return db.none(
    `
      UPDATE quotes SET
      content = $1,
      author = $2,
      genre_id = $3
      WHERE id = $4
    `,
    [quote.content, quote.author, quote.genre_id, id]
  );
};

Quote.destroy = id => {
  return db.none(
    `
      DELETE FROM quotes
      WHERE id = $1
    `,
    [id]
  );
};

module.exports = Quote;
