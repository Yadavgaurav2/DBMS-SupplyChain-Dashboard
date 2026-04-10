const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── DB CONNECTION ───────────────────────────────────────────
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'SupplyChainDB'
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SupplyChainDB');
});

// ─── HELPER ──────────────────────────────────────────────────
const query = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, results) =>
      err ? reject(err) : resolve(results)
    )
  );

// ─── ROUTES ──────────────────────────────────────────────────

// All Suppliers
app.get('/api/suppliers', async (req, res) => {
  try { res.json(await query('SELECT * FROM Supplier')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Add Supplier
app.post('/api/suppliers', async (req, res) => {
  try {
    const { name, location, contact } = req.body;
    const result = await query('INSERT INTO Supplier (name, location, contact) VALUES (?, ?, ?)', [name, location, contact]);
    res.json({ id: result.insertId, message: 'Supplier added successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Supplier
app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, contact } = req.body;
    await query('UPDATE Supplier SET name=?, location=?, contact=? WHERE supplier_id=?', [name, location, contact, id]);
    res.json({ message: 'Supplier updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Supplier
app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Supplier WHERE supplier_id=?', [id]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// All Products
app.get('/api/products', async (req, res) => {
  try { res.json(await query('SELECT * FROM Product')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Add Product
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, supplier_id } = req.body;
    const result = await query('INSERT INTO Product (name, price, supplier_id) VALUES (?, ?, ?)', [name, price, supplier_id]);
    res.json({ id: result.insertId, message: 'Product added successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, supplier_id } = req.body;
    await query('UPDATE Product SET name=?, price=?, supplier_id=? WHERE product_id=?', [name, price, supplier_id, id]);
    res.json({ message: 'Product updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Product WHERE product_id=?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// All Distributors
app.get('/api/distributors', async (req, res) => {
  try { res.json(await query('SELECT * FROM Distributor')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Add Distributor
app.post('/api/distributors', async (req, res) => {
  try {
    const { name, location, contact } = req.body;
    const result = await query('INSERT INTO Distributor (name, location, contact) VALUES (?, ?, ?)', [name, location, contact]);
    res.json({ id: result.insertId, message: 'Distributor added successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Distributor
app.put('/api/distributors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, contact } = req.body;
    await query('UPDATE Distributor SET name=?, location=?, contact=? WHERE distributor_id=?', [name, location, contact, id]);
    res.json({ message: 'Distributor updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Distributor
app.delete('/api/distributors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Distributor WHERE distributor_id=?', [id]);
    res.json({ message: 'Distributor deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// All Inventory
app.get('/api/inventory', async (req, res) => {
  try {
    res.json(await query(`
      SELECT i.product_id, p.name AS product_name, i.quantity, i.warehouse_location
      FROM Product p JOIN Inventory i ON p.product_id = i.product_id
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add/Update Inventory
app.post('/api/inventory', async (req, res) => {
  try {
    const { product_id, quantity, warehouse_location } = req.body;
    // Check if inventory exists
    const existing = await query('SELECT * FROM Inventory WHERE product_id=?', [product_id]);
    if (existing.length > 0) {
      await query('UPDATE Inventory SET quantity=?, warehouse_location=? WHERE product_id=?', [quantity, warehouse_location, product_id]);
      res.json({ message: 'Inventory updated successfully' });
    } else {
      const result = await query('INSERT INTO Inventory (product_id, quantity, warehouse_location) VALUES (?, ?, ?)', [product_id, quantity, warehouse_location]);
      res.json({ id: result.insertId, message: 'Inventory added successfully' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Inventory
app.put('/api/inventory/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;
    const { quantity, warehouse_location } = req.body;
    await query('UPDATE Inventory SET quantity=?, warehouse_location=? WHERE product_id=?', [quantity, warehouse_location, product_id]);
    res.json({ message: 'Inventory updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Inventory
app.delete('/api/inventory/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;
    await query('DELETE FROM Inventory WHERE product_id=?', [product_id]);
    res.json({ message: 'Inventory deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// All Orders
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

// Add Order
app.post('/api/orders', async (req, res) => {
  try {
    const { product_id, quantity, distributor_id } = req.body;
    const result = await query('INSERT INTO Orders (product_id, quantity, distributor_id, order_date) VALUES (?, ?, ?, NOW())', [product_id, quantity, distributor_id]);
    res.json({ id: result.insertId, message: 'Order added successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Order
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity, distributor_id } = req.body;
    await query('UPDATE Orders SET product_id=?, quantity=?, distributor_id=? WHERE order_id=?', [product_id, quantity, distributor_id, id]);
    res.json({ message: 'Order updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Orders WHERE order_id=?', [id]);
    res.json({ message: 'Order deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// All Shipments
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

// Add Shipment
app.post('/api/shipments', async (req, res) => {
  try {
    const { order_id, transport_cost, delivery_status } = req.body;
    const result = await query('INSERT INTO Shipment (order_id, transport_cost, delivery_status) VALUES (?, ?, ?)', [order_id, transport_cost, delivery_status || 'Pending']);
    res.json({ id: result.insertId, message: 'Shipment added successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Shipment
app.put('/api/shipments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { order_id, transport_cost, delivery_status } = req.body;
    await query('UPDATE Shipment SET order_id=?, transport_cost=?, delivery_status=? WHERE shipment_id=?', [order_id, transport_cost, delivery_status, id]);
    res.json({ message: 'Shipment updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Shipment
app.delete('/api/shipments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Shipment WHERE shipment_id=?', [id]);
    res.json({ message: 'Shipment deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Pending Deliveries
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

// High Demand Products
app.get('/api/analytics/high-demand', async (req, res) => {
  try {
    res.json(await query(`
      SELECT p.name, SUM(o.quantity) AS demand
      FROM Orders o JOIN Product p ON o.product_id = p.product_id
      GROUP BY o.product_id HAVING SUM(o.quantity) > 5
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Total Orders per Product
app.get('/api/analytics/orders-per-product', async (req, res) => {
  try {
    res.json(await query(`
      SELECT p.name, COUNT(*) AS total_orders, SUM(o.quantity) AS total_qty
      FROM Orders o JOIN Product p ON o.product_id = p.product_id
      GROUP BY o.product_id
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Supplier + Product join
app.get('/api/analytics/supplier-products', async (req, res) => {
  try {
    res.json(await query(`
      SELECT s.name AS supplier_name, p.name AS product_name, p.price
      FROM Supplier s JOIN Product p ON s.supplier_id = p.supplier_id
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Full Supply Chain View
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

// Dashboard Stats (summary cards)
app.get('/api/stats', async (req, res) => {
  try {
    const [suppliers] = await query('SELECT COUNT(*) AS cnt FROM Supplier');
    const [products]  = await query('SELECT COUNT(*) AS cnt FROM Product');
    const [orders]    = await query('SELECT COUNT(*) AS cnt FROM Orders');
    const [pending]   = await query("SELECT COUNT(*) AS cnt FROM Shipment WHERE delivery_status='Pending'");
    const [revenue]   = await query('SELECT SUM(p.price * o.quantity) AS total FROM Orders o JOIN Product p ON o.product_id=p.product_id');
    const [transport] = await query('SELECT SUM(transport_cost) AS total FROM Shipment');

    res.json({
      suppliers: suppliers.cnt,
      products: products.cnt,
      orders: orders.cnt,
      pending: pending.cnt,
      revenue: revenue.total || 0,
      transport: transport.total || 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── START ────────────────────────────────────────────────────
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`🚀 Supply Chain API running at http://localhost:${PORT}`)
);
