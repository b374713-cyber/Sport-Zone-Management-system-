// Front_end/snp/src/components/store/ProductFilters.js
import React from "react";
import "../../store_sp.css";

const ProductFilters = ({ filters, setFilters }) => {
  const update = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const clearFilters = () =>
    setFilters({
      search: "",
      category: "",
      minPrice: "",
      maxPrice: ""
    });

  return (
    <div className="store-filters">
      <input
        placeholder="Search by name..."
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
      />

      <select
        value={filters.category}
        onChange={(e) => update("category", e.target.value)}
      >
        <option value="">All Categories</option>
        <option value="Shoes">Shoes</option>
        <option value="Clothes">Clothes</option>
        <option value="Accessories">Accessories</option>
      </select>

      <input
        type="number"
        placeholder="Min Price"
        value={filters.minPrice}
        onChange={(e) => update("minPrice", e.target.value)}
      />

      <input
        type="number"
        placeholder="Max Price"
        value={filters.maxPrice}
        onChange={(e) => update("maxPrice", e.target.value)}
      />

      <button className="clear-btn" onClick={clearFilters}>
        Clear
      </button>
    </div>
  );
};

export default ProductFilters;
