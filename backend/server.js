const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Supply Chain API is running',
    endpoints: [
      '/api/suppliers',
      '/api/products',
      '/api/distributors',
      '/api/inventory',
      '/api/orders',
      '/api/shipments',
      '/api/analytics/high-demand',
      '/api/analytics/orders-per-product',
      '/api/analytics/supplier-products',
      '/api/analytics/full-chain',
      '/api/stats'
    ]
  });
});

// ─── DB CONNECTION POOL ───────────────────────────────────────
// FIX: Use a connection pool instead of a single connection.
// A single connection blocks under concurrent requests — the pool
// handles multiple requests at the same time without queuing them.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'SupplyChainDB',
  waitForConnections: true,
  connectionLimit: 10,   // max 10 simultaneous DB connections
  queueLimit: 0          // unlimited request queue
});

// Verify pool is working on startup
pool.getConnection().then(connection => {
  console.log('✅ Connected to SupplyChainDB (pool ready)');
  connection.release();
}).catch(err => {
  console.error('❌ MySQL connection pool failed:', err.message);
  process.exit(1);
});

// ─── HELPER ──────────────────────────────────────────────────
// FIX: Use pool.query() directly for promises with async/await.
const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

// ─── ROUTES ──────────────────────────────────────────────────

// ── Suppliers ────────────────────────────────────────────────

app.get('/api/suppliers', async (req, res) => {
  try { res.json(await query('SELECT * FROM Supplier')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { name, location, contact } = req.body;
    const result = await query(
      'INSERT INTO Supplier (name, location, contact) VALUES (?, ?, ?)',
      [name, location, contact]
    );
    res.json({ id: result.insertId, message: 'Supplier added successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { name, location, contact } = req.body;
    await query(
      'UPDATE Supplier SET name=?, location=?, contact=? WHERE supplier_id=?',
      [name, location, contact, req.params.id]
    );
    res.json({ message: 'Supplier updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await query('DELETE FROM Supplier WHERE supplier_id=?', [req.params.id]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Products ─────────────────────────────────────────────────

app.get('/api/products', async (req, res) => {
  try { res.json(await query('SELECT * FROM Product')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, supplier_id } = req.body;
    const result = await query(
      'INSERT INTO Product (name, price, supplier_id) VALUES (?, ?, ?)',
      [name, price, supplier_id]
    );
    res.json({ id: result.insertId, message: 'Product added successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, supplier_id } = req.body;
    await query(
      'UPDATE Product SET name=?, price=?, supplier_id=? WHERE product_id=?',
      [name, price, supplier_id, req.params.id]
    );
    res.json({ message: 'Product updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await query('DELETE FROM Product WHERE product_id=?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Distributors ─────────────────────────────────────────────

app.get('/api/distributors', async (req, res) => {
  try { res.json(await query('SELECT * FROM Distributor')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/distributors', async (req, res) => {
  try {
    const { name, location, contact } = req.body;
    const result = await query(
      'INSERT INTO Distributor (name, location, contact) VALUES (?, ?, ?)',
      [name, location, contact]
    );
    res.json({ id: result.insertId, message: 'Distributor added successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/distributors/:id', async (req, res) => {
  try {
    const { name, location, contact } = req.body;
    await query(
      'UPDATE Distributor SET name=?, location=?, contact=? WHERE distributor_id=?',
      [name, location, contact, req.params.id]
    );
    res.json({ message: 'Distributor updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/distributors/:id', async (req, res) => {
  try {
    await query('DELETE FROM Distributor WHERE distributor_id=?', [req.params.id]);
    res.json({ message: 'Distributor deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Inventory ─────────────────────────────────────────────────

app.get('/api/inventory', async (req, res) => {
  try {
    res.json(await query(`
      SELECT i.product_id, p.name AS product_name, i.quantity, i.warehouse_location
      FROM Product p
      JOIN Inventory i ON p.product_id = i.product_id
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { product_id, quantity, warehouse_location } = req.body;
    const existing = await query('SELECT product_id FROM Inventory WHERE product_id=?', [product_id]);
    if (existing.length > 0) {
      await query(
        'UPDATE Inventory SET quantity=?, warehouse_location=? WHERE product_id=?',
        [quantity, warehouse_location, product_id]
      );
      res.json({ message: 'Inventory updated successfully' });
    } else {
      const result = await query(
        'INSERT INTO Inventory (product_id, quantity, warehouse_location) VALUES (?, ?, ?)',
        [product_id, quantity, warehouse_location]
      );
      res.json({ id: result.insertId, message: 'Inventory added successfully' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/inventory/:product_id', async (req, res) => {
  try {
    const { quantity, warehouse_location } = req.body;
    await query(
      'UPDATE Inventory SET quantity=?, warehouse_location=? WHERE product_id=?',
      [quantity, warehouse_location, req.params.product_id]
    );
    res.json({ message: 'Inventory updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/inventory/:product_id', async (req, res) => {
  try {
    await query('DELETE FROM Inventory WHERE product_id=?', [req.params.product_id]);
    res.json({ message: 'Inventory deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Orders ────────────────────────────────────────────────────

app.get('/api/orders', async (req, res) => {
  try {
    res.json(await query(`
      SELECT o.order_id, p.name AS product_name, o.quantity,
             o.order_date, d.name AS distributor_name
      FROM Orders o
      JOIN Product p ON o.product_id = p.product_id
      JOIN Distributor d ON o.distributor_id = d.distributor_id
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { product_id, quantity, distributor_id } = req.body;
    const result = await query(
      'INSERT INTO Orders (product_id, quantity, distributor_id, order_date) VALUES (?, ?, ?, NOW())',
      [product_id, quantity, distributor_id]
    );
    res.json({ id: result.insertId, message: 'Order added successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { product_id, quantity, distributor_id } = req.body;
    await query(
      'UPDATE Orders SET product_id=?, quantity=?, distributor_id=? WHERE order_id=?',
      [product_id, quantity, distributor_id, req.params.id]
    );
    res.json({ message: 'Order updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await query('DELETE FROM Orders WHERE order_id=?', [req.params.id]);
    res.json({ message: 'Order deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Shipments ─────────────────────────────────────────────────
// FIX: /pending MUST be registered before /:id — otherwise Express
// treats the string "pending" as a value for the :id param.

app.get('/api/shipments/pending', async (req, res) => {
  try {
    res.json(await query(`
      SELECT sh.*, p.name AS product_name
      FROM Shipment sh
      JOIN Orders o ON sh.order_id = o.order_id
      JOIN Product p ON o.product_id = p.product_id
      WHERE sh.delivery_status = 'Pending'
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/shipments', async (req, res) => {
  try {
    res.json(await query(`
      SELECT sh.shipment_id, o.order_id, p.name AS product_name,
             sh.transport_cost, sh.delivery_status
      FROM Shipment sh
      JOIN Orders o ON sh.order_id = o.order_id
      JOIN Product p ON o.product_id = p.product_id
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/shipments', async (req, res) => {
  try {
    const { order_id, transport_cost, delivery_status } = req.body;
    const result = await query(
      'INSERT INTO Shipment (order_id, transport_cost, delivery_status) VALUES (?, ?, ?)',
      [order_id, transport_cost, delivery_status || 'Pending']
    );
    res.json({ id: result.insertId, message: 'Shipment added successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/shipments/:id', async (req, res) => {
  try {
    const { order_id, transport_cost, delivery_status } = req.body;
    await query(
      'UPDATE Shipment SET order_id=?, transport_cost=?, delivery_status=? WHERE shipment_id=?',
      [order_id, transport_cost, delivery_status, req.params.id]
    );
    res.json({ message: 'Shipment updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/shipments/:id', async (req, res) => {
  try {
    await query('DELETE FROM Shipment WHERE shipment_id=?', [req.params.id]);
    res.json({ message: 'Shipment deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Analytics ─────────────────────────────────────────────────

app.get('/api/analytics/high-demand', async (req, res) => {
  try {
    res.json(await query(`
      SELECT p.name, SUM(o.quantity) AS demand
      FROM Orders o
      JOIN Product p ON o.product_id = p.product_id
      GROUP BY o.product_id
      HAVING SUM(o.quantity) > 5
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/analytics/orders-per-product', async (req, res) => {
  try {
    res.json(await query(`
      SELECT p.name, COUNT(*) AS total_orders, SUM(o.quantity) AS total_qty
      FROM Orders o
      JOIN Product p ON o.product_id = p.product_id
      GROUP BY o.product_id
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/analytics/supplier-products', async (req, res) => {
  try {
    res.json(await query(`
      SELECT s.name AS supplier_name, p.name AS product_name, p.price
      FROM Supplier s
      JOIN Product p ON s.supplier_id = p.supplier_id
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/analytics/full-chain', async (req, res) => {
  try {
    res.json(await query(`
      SELECT p.name, i.quantity AS stock, o.quantity AS order_qty,
             sh.delivery_status, sh.transport_cost
      FROM Product p
      JOIN Inventory i ON p.product_id = i.product_id
      JOIN Orders o ON p.product_id = o.product_id
      JOIN Shipment sh ON o.order_id = sh.order_id
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Dashboard Stats ────────────────────────────────────────────
// FIX: All 6 queries now run IN PARALLEL with Promise.all instead of
// sequentially. This cuts /api/stats response time by ~5x.

app.get('/api/stats', async (req, res) => {
  try {
    const [
      [suppliers],
      [products],
      [orders],
      [pending],
      [revenue],
      [transport]
    ] = await Promise.all([
      query('SELECT COUNT(*) AS cnt FROM Supplier'),
      query('SELECT COUNT(*) AS cnt FROM Product'),
      query('SELECT COUNT(*) AS cnt FROM Orders'),
      query("SELECT COUNT(*) AS cnt FROM Shipment WHERE delivery_status='Pending'"),
      query('SELECT SUM(p.price * o.quantity) AS total FROM Orders o JOIN Product p ON o.product_id=p.product_id'),
      query('SELECT SUM(transport_cost) AS total FROM Shipment')
    ]);

    res.json({
      suppliers: suppliers.cnt,
      products:  products.cnt,
      orders:    orders.cnt,
      pending:   pending.cnt,
      revenue:   revenue.total  || 0,
      transport: transport.total || 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── START ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Supply Chain API running at http://localhost:${PORT}`)
);