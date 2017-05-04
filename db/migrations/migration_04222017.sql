\connect adaquote_development

CREATE TABLE IF NOT EXISTS genres (
  id BIGSERIAL PRIMARY KEY,
  genre_type VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS quotes (
  id BIGSERIAL PRIMARY KEY,
  content VARCHAR(1024),
  author VARCHAR(255),
  genre_id INTEGER REFERENCES genres(id)
);
