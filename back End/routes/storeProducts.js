// Back_end/routes/storeProducts.js  — FULL FILE

const express = require("express");
const router = express.Router();
const { sql, getDatabase } = require("../config/database");

// helpers
function buildStatus(stockQty) {
  if (stockQty <= 0) return "Out of Stock";
  if (stockQty <= 5) return "Low Stock";
  return "In Stock";
}

/**
 * GET /api/store/products
 * Filters (query):
 *  - store_id (optional)
 *  - category (optional)
 *  - minPrice / maxPrice (optional)
 *  - search (optional)
 */
router.get("/", async (req, res) => {
  try {
    const pool = await getDatabase();

    const { store_id, category, minPrice, maxPrice, search } = req.query;

    let query = `
      SELECT 
        p.product_id, p.name, p.category, p.price, p.stock_qty, 
        p.image_url, p.created_at,
        sp.store_id
      FROM Products p
      LEFT JOIN StoreProducts sp ON sp.product_id = p.product_id
      WHERE 1=1
    `;

    const request = pool.request();

    if (store_id) {
  // check store exists
  const storeCheck = await pool.request()
    .input("store_id", sql.Int, store_id)
    .query(`SELECT store_id FROM ClothingStores WHERE store_id=@store_id`);

  if (storeCheck.recordset.length) {
    await pool.request()
      .input("store_id", sql.Int, store_id)
      .input("product_id", sql.Int, newProduct.product_id)
      .query(`
        INSERT INTO StoreProducts (store_id, product_id, created_at)
        VALUES (@store_id, @product_id, GETDATE())
      `);
  }
}


    if (category) {
      query += " AND p.category = @category";
      request.input("category", sql.NVarChar, category);
    }

    if (minPrice) {
      query += " AND p.price >= @minPrice";
      request.input("minPrice", sql.Decimal(10, 2), minPrice);
    }

    if (maxPrice) {
      query += " AND p.price <= @maxPrice";
      request.input("maxPrice", sql.Decimal(10, 2), maxPrice);
    }

    if (search) {
      query += " AND p.name LIKE @search";
      request.input("search", sql.NVarChar, `%${search}%`);
    }

    query += " ORDER BY p.created_at DESC";

    const result = await request.query(query);

    const products = result.recordset.map((p) => ({
      ...p,
      status: buildStatus(p.stock_qty),
      // optional: make absolute url if you want
      // image_url: p.image_url ? `http://localhost:5000${p.image_url}` : null,
    }));

    res.json(products);
  } catch (err) {
    console.error("GET products error:", err);
    res.status(500).json({ message: "Server error fetching products." });
  }
});

/**
 * POST /api/store/products
 * body: { name, category, price, stock_qty, store_id(optional), image_url(optional) }
 */


/**
 * POST /api/store/products
 * body: { name, category, price, stock_qty, store_id(optional), image_url(optional) }
 */
router.post("/", async (req, res) => {
  let pool;
  try {
    pool = await getDatabase();

    const { name, category, price, stock_qty, store_id, image_url } = req.body;

    // 1) insert product
    const insertProduct = await pool.request()
      .input("name", sql.NVarChar, name)
      .input("category", sql.NVarChar, category)
      .input("price", sql.Decimal(10, 2), price)
      .input("stock_qty", sql.Int, stock_qty)
      .input("image_url", sql.NVarChar, image_url || null)
      .query(`
        INSERT INTO Products (name, category, price, stock_qty, image_url, created_at)
        OUTPUT INSERTED.*
        VALUES (@name, @category, @price, @stock_qty, @image_url, GETDATE())
      `);

    const newProduct = insertProduct.recordset[0];

    // 2) link to store only if store_id is valid AND exists
    const sid = Number(store_id);
    if (sid && !Number.isNaN(sid)) {
      const storeCheck = await pool.request()
        .input("store_id", sql.Int, sid)
        .query(`SELECT store_id FROM ClothingStores WHERE store_id=@store_id`);

      if (storeCheck.recordset.length) {
        await pool.request()
          .input("store_id", sql.Int, sid)
          .input("product_id", sql.Int, newProduct.product_id)
          .query(`
            INSERT INTO StoreProducts (store_id, product_id, created_at)
            VALUES (@store_id, @product_id, GETDATE())
          `);
      } else {
        // store_id not found -> don't fail whole request
        console.warn("store_id not found, skipping StoreProducts insert:", sid);
      }
    }

    // ✅ success
    res.status(201).json({
      ...newProduct,
      store_id: sid || null,
      status: buildStatus(newProduct.stock_qty),
    });
  } catch (err) {
    console.error("POST product error:", err);
    res.status(500).json({ message: "Server error adding product." });
  }
});





/**
 * PUT /api/store/products/:id
 * body: any of { name, category, price, stock_qty, image_url }
 */
router.put("/:id", async (req, res) => {
  try {
    const pool = await getDatabase();

    const { id } = req.params;
    const { name, category, price, stock_qty, image_url } = req.body;

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, name || null)
      .input("category", sql.NVarChar, category || null)
      .input("price", sql.Decimal(10, 2), price ?? null)
      .input("stock_qty", sql.Int, stock_qty ?? null)
      .input("image_url", sql.NVarChar, image_url || null)
      .query(`
        UPDATE Products
        SET
          name = COALESCE(@name, name),
          category = COALESCE(@category, category),
          price = COALESCE(@price, price),
          stock_qty = COALESCE(@stock_qty, stock_qty),
          image_url = COALESCE(@image_url, image_url)
        OUTPUT INSERTED.*
        WHERE product_id = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Product not found." });
    }

    const updated = result.recordset[0];
    res.json({ ...updated, status: buildStatus(updated.stock_qty) });
  } catch (err) {
    console.error("PUT product error:", err);
    res.status(500).json({ message: "Server error updating product." });
  }
});

/**
 * DELETE /api/store/products/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const pool = await getDatabase();
    const { id } = req.params;

    // delete relation first
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM StoreProducts WHERE product_id = @id`);

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM Products WHERE product_id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ message: "Product deleted." });
  } catch (err) {
    console.error("DELETE product error:", err);
    res.status(500).json({ message: "Server error deleting product." });
  }
});
router.get("/", async (req, res) => {
  try {
    const pool = await getDatabase();
    const { store_id, category, minPrice, maxPrice, search } = req.query;

    let query = `
      SELECT 
        p.product_id, p.name, p.category, p.price, p.stock_qty, 
        p.image_url, p.created_at
      FROM dbo.Products p
      WHERE 1=1
    `;

    const request = pool.request();

    // ✅ Filter by store_id (NO INSERTS here)
    if (store_id) {
      query += `
        AND EXISTS (
          SELECT 1
          FROM dbo.StoreProducts sp
          WHERE sp.product_id = p.product_id
            AND sp.store_id = @store_id
        )
      `;
      request.input("store_id", sql.Int, Number(store_id));
    }

    if (category) {
      query += " AND p.category = @category";
      request.input("category", sql.NVarChar, category);
    }

    if (minPrice) {
      query += " AND p.price >= @minPrice";
      request.input("minPrice", sql.Decimal(10, 2), Number(minPrice));
    }

    if (maxPrice) {
      query += " AND p.price <= @maxPrice";
      request.input("maxPrice", sql.Decimal(10, 2), Number(maxPrice));
    }

    if (search) {
      query += " AND p.name LIKE @search";
      request.input("search", sql.NVarChar, `%${search}%`);
    }

    query += " ORDER BY p.created_at DESC";

    const result = await request.query(query);

    const products = result.recordset.map((p) => ({
      ...p,
      status: buildStatus(p.stock_qty),
    }));

    // ✅ IMPORTANT: return an object so mobile can read d.products
    res.json({ products });
  } catch (err) {
    console.error("GET products error:", err);
    res.status(500).json({ message: "Server error fetching products." });
  }
});
/**
 * POST /api/store/products/:id/stock-in
 * body: { quantity }
 */
router.post("/:id/stock-in", async (req, res) => {
  try {
    const pool = await getDatabase();
    const id = Number(req.params.id);
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive integer." });
    }

    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("qty", sql.Int, quantity)
      .query(`
        UPDATE Products
        SET stock_qty = stock_qty + @qty
        OUTPUT INSERTED.*
        WHERE product_id = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Product not found." });
    }

    const updated = result.recordset[0];
    return res.json({ ...updated, status: buildStatus(updated.stock_qty) });
  } catch (err) {
    console.error("stock-in error:", err);
    res.status(500).json({ message: "Server error stock-in." });
  }
});

/**
 * POST /api/store/products/:id/stock-out
 * body: { quantity }
 */
router.post("/:id/stock-out", async (req, res) => {
  try {
    const pool = await getDatabase();
    const id = Number(req.params.id);
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive integer." });
    }

    // prevent going negative
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("qty", sql.Int, quantity)
      .query(`
        UPDATE Products
        SET stock_qty = CASE WHEN stock_qty - @qty < 0 THEN 0 ELSE stock_qty - @qty END
        OUTPUT INSERTED.*
        WHERE product_id = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Product not found." });
    }

    const updated = result.recordset[0];
    return res.json({ ...updated, status: buildStatus(updated.stock_qty) });
  } catch (err) {
    console.error("stock-out error:", err);
    res.status(500).json({ message: "Server error stock-out." });
  }
});

module.exports = router;
