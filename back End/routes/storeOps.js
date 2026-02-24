const express = require("express");
const router = express.Router();

const { sql, getDatabase } = require("../config/database");

/**
 * POST /api/store/stock/in
 * body: { product_id, quantity }
 */
router.post("/stock/in", async (req, res) => {
  try {
const pool = await getDatabase();
    const { product_id, quantity } = req.body;

    const result = await pool.request()
      .input("product_id", sql.Int, product_id)
      .input("quantity", sql.Int, quantity)
      .query(`
        UPDATE Products
        SET stock_qty = stock_qty + @quantity
        OUTPUT INSERTED.*
        WHERE product_id = @product_id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({
      message: "Stock increased.",
      product: result.recordset[0],
    });
  } catch (err) {
    console.error("stock in error:", err);
    res.status(500).json({ message: "Server error stock in." });
  }
});

/**
 * POST /api/store/stock/out
 * body: { product_id, quantity }
 */
router.post("/stock/out", async (req, res) => {
  try {
const pool = await getDatabase();
    const { product_id, quantity } = req.body;

    // check available stock
    const check = await pool.request()
      .input("product_id", sql.Int, product_id)
      .query(`SELECT stock_qty FROM Products WHERE product_id = @product_id`);

    if (!check.recordset.length) {
      return res.status(404).json({ message: "Product not found." });
    }

    const currentQty = check.recordset[0].stock_qty;
    if (currentQty < quantity) {
      return res.status(400).json({
        message: `Not enough stock. Available: ${currentQty}`,
      });
    }

    const result = await pool.request()
      .input("product_id", sql.Int, product_id)
      .input("quantity", sql.Int, quantity)
      .query(`
        UPDATE Products
        SET stock_qty = stock_qty - @quantity
        OUTPUT INSERTED.*
        WHERE product_id = @product_id
      `);

    res.json({
      message: "Stock decreased.",
      product: result.recordset[0],
    });
  } catch (err) {
    console.error("stock out error:", err);
    res.status(500).json({ message: "Server error stock out." });
  }
});

module.exports = router;
