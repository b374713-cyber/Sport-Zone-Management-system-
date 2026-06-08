// import React, { useEffect, useMemo, useState } from "react";
// import {
//   getProducts,
//   addProduct,
//   updateProduct,
//   deleteProduct,
//   stockIn,
//   stockOut,
//   resolveImageUrl,
// } from "../services/storeService";

// import ProductFilters from "../components/store/ProductFilters";
// import AddProductModal from "../components/store/AddProductModal";
// import StoreIntroCarousel from "../components/store/StoreIntroCarousel";
// import ProductCard from "../components/store/ProductCard";
// import EditProductModal from "../components/store/EditProductModal";
// import AISuggestionsTab from "../components/store/AISuggestionsTab";
// import ReservedItemsTab from "../components/store/ReservedItemsTab";
// import SelledItemsTab from "../components/store/SelledItemsTab";

// import "../store_sp.css";

// const StoreDashboard = () => {
//   const [products, setProducts] = useState([]); // always array
//   const [filters, setFilters] = useState({
//     search: "",
//     category: "",
//     minPrice: "",
//     maxPrice: "",
//   });

//   const [loading, setLoading] = useState(true);
//   const [openAdd, setOpenAdd] = useState(false);
//   const [showIntro, setShowIntro] = useState(true);

//   const [openEdit, setOpenEdit] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);

//   const [activeTab, setActiveTab] = useState("products"); // products | ai | reserved

//   const fetchProducts = async () => {
//     setLoading(true);
//     try {
//       const data = await getProducts(filters);

//       // backend may return array OR {products:[...]}
//       const list = Array.isArray(data)
//         ? data
//         : Array.isArray(data?.products)
//         ? data.products
//         : [];

//       setProducts(list);
//     } catch (err) {
//       console.error("fetchProducts error:", err);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [filters]);

//   const stats = useMemo(() => {
//     const list = Array.isArray(products) ? products : [];
//     const total = list.length;

//     const inStock = list.filter((p) => Number(p.stock_qty) > 5).length;
//     const lowStock = list.filter(
//       (p) => Number(p.stock_qty) > 0 && Number(p.stock_qty) <= 5
//     ).length;
//     const outStock = list.filter((p) => Number(p.stock_qty) <= 0).length;

//     return { total, inStock, lowStock, outStock };
//   }, [products]);

//   const newArrivals = useMemo(() => {
//     const list = Array.isArray(products) ? products : [];
//     return list.slice(0, 4);
//   }, [products]);

//   // ---------------- Handlers ----------------
//   const handleAddProduct = async (payload) => {
//     try {
//       await addProduct(payload);
//       setOpenAdd(false);
//       fetchProducts();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to add product");
//     }
//   };

//   const handleEditClick = (p) => {
//     setSelectedProduct(p);
//     setOpenEdit(true);
//   };

//   const handleEditSave = async (id, payload) => {
//     try {
//       await updateProduct(id, payload);
//       fetchProducts();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to update product");
//     }
//   };

//   const handleDeleteProduct = async (id) => {
//     if (!window.confirm("Delete this product?")) return;
//     try {
//       await deleteProduct(id);
//       fetchProducts();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to delete product");
//     }
//   };

//   const handleStockIn = async (product_id, quantity) => {
//     try {
//       await stockIn(product_id, quantity);
//       fetchProducts();
//     } catch (err) {
//       console.error(err);
//       alert("Failed stock in");
//     }
//   };

//   const handleStockOut = async (product_id, quantity) => {
//     try {
//       await stockOut(product_id, quantity);
//       fetchProducts();
//     } catch (err) {
//       console.error(err);
//       alert("Failed stock out");
//     }
//   };

//   if (showIntro) {
//     return <StoreIntroCarousel onContinue={() => setShowIntro(false)} />;
//   }

//   return (
//     <div className="store-page store-adidas">
//       {/* HERO */}
//       <div className="store-hero">
//         <div>
//           <h1>SPORT STORE</h1>
//           <p>Manage products, stock, arrivals, and reservations in one place.</p>
//         </div>

//         {activeTab === "products" && (
//           <button className="hero-btn" onClick={() => setOpenAdd(true)}>
//             + Add Product
//           </button>
//         )}
//       </div>

//       {/* TABS */}
//       <div className="store-tabs">
//         <button
//           className={`store-tab-btn ${activeTab === "products" ? "active" : ""}`}
//           onClick={() => setActiveTab("products")}
//         >
//           🛍️ Products
//         </button>

//         <button
//           className={`store-tab-btn ${activeTab === "ai" ? "active" : ""}`}
//           onClick={() => setActiveTab("ai")}
//         >
//           🤖 AI Suggestions
//         </button>

//         <button
//           className={`store-tab-btn ${activeTab === "reserved" ? "active" : ""}`}
//           onClick={() => setActiveTab("reserved")}
//         >
//           📌 Reserved Items
//         </button>
//         <button
//   className={`store-tab-btn ${activeTab === "selled" ? "active" : ""}`}
//   onClick={() => setActiveTab("selled")}
// >
//   💰 Selled Items
// </button>

//       </div>
// {activeTab === "selled" && <SelledItemsTab />}

//       {/* PRODUCTS TAB */}
//       {activeTab === "products" && (
//         <>
//           <div className="store-stats">
//             <StatCard title="Total" value={stats.total} />
//             <StatCard title="In Stock" value={stats.inStock} />
//             <StatCard title="Low Stock" value={stats.lowStock} />
//             <StatCard title="Out Stock" value={stats.outStock} />
//           </div>

//           <div className="section-title">
//             <h3>New Arrivals</h3>
//             <span>Latest products added to your store</span>
//           </div>

//           <div className="arrivals-row">
//             {newArrivals.map((p) => (
//               <div key={p.product_id} className="arrival-card">
//                 <img
//                   src={p.image_url ? resolveImageUrl(p.image_url) : ""}
//                   alt={p.name}
//                 />
//                 <div className="arrival-info">
//                   <div className="arrival-name">{p.name}</div>
//                   <div className="arrival-price">${p.price}</div>
//                 </div>
//               </div>
//             ))}
//             {newArrivals.length === 0 && (
//               <div className="muted">No arrivals yet.</div>
//             )}
//           </div>

//           <div className="filters-wrap">
//             <ProductFilters filters={filters} setFilters={setFilters} />
//           </div>

//           <div className="section-title">
//             <h3>All Products</h3>
//             <span>{Array.isArray(products) ? products.length : 0} items</span>
//           </div>

//           {loading ? (
//             <p>Loading...</p>
//           ) : (
//             <div className="prod-grid">
//               {(Array.isArray(products) ? products : []).map((p) => (
//                 <ProductCard
//                   key={p.product_id}
//                   p={p}
//                   onEdit={handleEditClick}
//                   onDelete={handleDeleteProduct}
//                   onStockIn={handleStockIn}
//                   onStockOut={handleStockOut}
//                 />
//               ))}

//               {(Array.isArray(products) ? products.length : 0) === 0 && (
//                 <div className="muted">No products found.</div>
//               )}
//             </div>
//           )}
//         </>
//       )}

//       {/* AI TAB */}
//       {activeTab === "ai" && <AISuggestionsTab products={products} />}

//       {/* RESERVED TAB */}
//       {activeTab === "reserved" && (
//         <ReservedItemsTab onRefreshProducts={fetchProducts} />
//       )}

//       {/* MODALS */}
//       <AddProductModal
//         open={openAdd}
//         onClose={() => setOpenAdd(false)}
//         onSubmit={handleAddProduct}
//       />

//       <EditProductModal
//         open={openEdit}
//         onClose={() => setOpenEdit(false)}
//         onSubmit={handleEditSave}
//         product={selectedProduct}
//       />
//     </div>
//   );
// };

// const StatCard = ({ title, value }) => (
//   <div className="stat-card">
//     <div className="stat-title">{title}</div>
//     <div className="stat-value">{value}</div>
//   </div>
// );

// export default StoreDashboard;
import React, { useEffect, useMemo, useState } from "react";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  stockIn,
  stockOut,
  resolveImageUrl,
} from "../services/storeService";

import ProductFilters from "../components/store/ProductFilters";
import AddProductModal from "../components/store/AddProductModal";
import StoreIntroCarousel from "../components/store/StoreIntroCarousel";
import ProductCard from "../components/store/ProductCard";
import EditProductModal from "../components/store/EditProductModal";
import AISuggestionsTab from "../components/store/AISuggestionsTab";
import ReservedItemsTab from "../components/store/ReservedItemsTab";
import SelledItemsTab from "../components/store/SelledItemsTab";

import "../store_sp.css";

const StoreDashboard = () => {
  const [products, setProducts] = useState([]); // always array
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
  });

  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const [openEdit, setOpenEdit] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [activeTab, setActiveTab] = useState("products"); // products | ai | reserved

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(filters);

      // backend may return array OR {products:[...]}
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
        ? data.products
        : [];

      setProducts(list);
    } catch (err) {
      console.error("fetchProducts error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const stats = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const total = list.length;

    const inStock = list.filter((p) => Number(p.stock_qty) > 5).length;
    const lowStock = list.filter(
      (p) => Number(p.stock_qty) > 0 && Number(p.stock_qty) <= 5
    ).length;
    const outStock = list.filter((p) => Number(p.stock_qty) <= 0).length;

    return { total, inStock, lowStock, outStock };
  }, [products]);

  const newArrivals = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list.slice(0, 4);
  }, [products]);

  // ---------------- Handlers ----------------
  const handleAddProduct = async (payload) => {
    try {
      await addProduct(payload);
      setOpenAdd(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    }
  };

  const handleEditClick = (p) => {
    setSelectedProduct(p);
    setOpenEdit(true);
  };

  const handleEditSave = async (id, payload) => {
    try {
      await updateProduct(id, payload);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to update product");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product");
    }
  };

  const handleStockIn = async (product_id, quantity) => {
    try {
      await stockIn(product_id, quantity);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed stock in");
    }
  };

  const handleStockOut = async (product_id, quantity) => {
    try {
      await stockOut(product_id, quantity);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed stock out");
    }
  };

  if (showIntro) {
    return <StoreIntroCarousel onContinue={() => setShowIntro(false)} />;
  }

  return (
    <div className="store-page store-adidas">
      {/* Inline CSS for scrollable grid */}
      <style>{`
        .scrollable-products-grid {
          height: 600px; /* Fixed height */
          overflow-y: auto; /* Enable vertical scrolling */
          overflow-x: hidden; /* Prevent horizontal scroll */
          padding: 15px;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        /* Custom scrollbar styling */
        .scrollable-products-grid::-webkit-scrollbar {
          width: 10px;
        }
        
        .scrollable-products-grid::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .scrollable-products-grid::-webkit-scrollbar-thumb {
          background: #6a4fb3; /* Purple from your theme */
          border-radius: 10px;
        }
        
        .scrollable-products-grid::-webkit-scrollbar-thumb:hover {
          background: #3b2a88; /* Darker purple */
        }
        
        /* For Firefox */
        .scrollable-products-grid {
          scrollbar-width: thin;
          scrollbar-color: #6a4fb3 #f1f1f1;
        }
        
        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .scrollable-products-grid {
            height: 500px;
          }
        }
        
        @media (max-width: 992px) {
          .scrollable-products-grid {
            height: 450px;
          }
        }
        
        @media (max-width: 768px) {
          .scrollable-products-grid {
            height: 400px;
          }
        }
        
        /* Make the products grid inside scrollable */
        .scrollable-products-grid .prod-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin: 0;
        }
      `}</style>

      {/* HERO */}
      <div className="store-hero">
        <div>
          <h1>SPORT STORE</h1>
          <p>Manage products, stock, arrivals, and reservations in one place.</p>
        </div>

        {activeTab === "products" && (
          <button className="hero-btn" onClick={() => setOpenAdd(true)}>
            + Add Product
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="store-tabs">
        <button
          className={`store-tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          🛍️ Products
        </button>

        <button
          className={`store-tab-btn ${activeTab === "ai" ? "active" : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          🤖 AI Suggestions
        </button>

        <button
          className={`store-tab-btn ${activeTab === "reserved" ? "active" : ""}`}
          onClick={() => setActiveTab("reserved")}
        >
          📌 Reserved Items
        </button>
        <button
          className={`store-tab-btn ${activeTab === "selled" ? "active" : ""}`}
          onClick={() => setActiveTab("selled")}
        >
          💰 Selled Items
        </button>
      </div>
      {activeTab === "selled" && <SelledItemsTab />}

      {/* PRODUCTS TAB */}
      {activeTab === "products" && (
        <>
          <div className="store-stats">
            <StatCard title="Total" value={stats.total} />
            <StatCard title="In Stock" value={stats.inStock} />
            <StatCard title="Low Stock" value={stats.lowStock} />
            <StatCard title="Out Stock" value={stats.outStock} />
          </div>

          <div className="section-title">
            <h3>New Arrivals</h3>
            <span>Latest products added to your store</span>
          </div>

          <div className="arrivals-row">
            {newArrivals.map((p) => (
              <div key={p.product_id} className="arrival-card">
                <img
                  src={p.image_url ? resolveImageUrl(p.image_url) : ""}
                  alt={p.name}
                />
                <div className="arrival-info">
                  <div className="arrival-name">{p.name}</div>
                  <div className="arrival-price">${p.price}</div>
                </div>
              </div>
            ))}
            {newArrivals.length === 0 && (
              <div className="muted">No arrivals yet.</div>
            )}
          </div>

          <div className="filters-wrap">
            <ProductFilters filters={filters} setFilters={setFilters} />
          </div>

          <div className="section-title">
            <h3>All Products</h3>
            <span>{Array.isArray(products) ? products.length : 0} items</span>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="scrollable-products-grid">
              <div className="prod-grid">
                {(Array.isArray(products) ? products : []).map((p) => (
                  <ProductCard
                    key={p.product_id}
                    p={p}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteProduct}
                    onStockIn={handleStockIn}
                    onStockOut={handleStockOut}
                  />
                ))}

                {(Array.isArray(products) ? products.length : 0) === 0 && (
                  <div className="muted">No products found.</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* AI TAB */}
      {activeTab === "ai" && <AISuggestionsTab products={products} />}

      {/* RESERVED TAB */}
      {activeTab === "reserved" && (
        <ReservedItemsTab onRefreshProducts={fetchProducts} />
      )}

      {/* MODALS */}
      <AddProductModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={handleAddProduct}
      />

      <EditProductModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSubmit={handleEditSave}
        product={selectedProduct}
      />
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="stat-card">
    <div className="stat-title">{title}</div>
    <div className="stat-value">{value}</div>
  </div>
);

export default StoreDashboard;