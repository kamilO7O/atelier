CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL CHECK (category IN ('Диваны', 'Кресла', 'Кровати', 'Столы')),
  price INTEGER NOT NULL CHECK (price >= 0),
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
