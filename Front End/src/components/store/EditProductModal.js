// import React, { useEffect, useState } from "react";
// import { uploadProductImage } from "../../services/storeService";
// import "../../store_sp.css";

// const EditProductModal = ({ open, onClose, product, onSubmit }) => {
//   const [form, setForm] = useState({
//     name: "",
//     category: "Shoes",
//     price: "",
//     stock_qty: "",
//     image_url: "",
//   });

//   const [file, setFile] = useState(null);
//   const [uploading, setUploading] = useState(false);

//   // لما يفتح المودال نعبّي الفورم ببيانات المنتج
//   useEffect(() => {
//     if (product) {
//       setForm({
//         name: product.name || "",
//         category: product.category || "Shoes",
//         price: product.price ?? "",
//         stock_qty: product.stock_qty ?? "",
//         image_url: product.image_url || "",
//       });
//       setFile(null);
//     }
//   }, [product]);

//   if (!open || !product) return null;

//   const handleChange = (e) =>
//     setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

//   const handleFileChange = (e) => {
//     const selected = e.target.files?.[0];
//     setFile(selected || null);
//   };

//   const handleSubmit = async () => {
//     try {
//       setUploading(true);

//       let image_url = form.image_url;

//       // اذا المختار صورة جديدة → نرفعها وناخذ URL جديد
//       if (file) {
//         const uploadRes = await uploadProductImage(file);
//         image_url = uploadRes.image_url;
//       }

//       await onSubmit(product.product_id, {
//         name: form.name,
//         category: form.category,
//         price: Number(form.price),
//         stock_qty: Number(form.stock_qty),
//         image_url,
//       });

//       onClose();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to update product");
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="store-modal-backdrop" onClick={onClose}>
//       <div
//         className="store-modal"
//         onClick={(e) => e.stopPropagation()}
//         style={{ width: 520, maxWidth: "95vw" }}
//       >
//         <h2>Edit Product</h2>

//         <input
//           name="name"
//           placeholder="Product name"
//           value={form.name}
//           onChange={handleChange}
//         />

//         <select
//           name="category"
//           value={form.category}
//           onChange={handleChange}
//         >
//           <option value="Shoes">Shoes</option>
//           <option value="Clothes">Clothes</option>
//           <option value="Accessories">Accessories</option>
//         </select>

//         <input
//           name="price"
//           placeholder="Price"
//           type="number"
//           value={form.price}
//           onChange={handleChange}
//         />

//         <input
//           name="stock_qty"
//           placeholder="Quantity"
//           type="number"
//           value={form.stock_qty}
//           onChange={handleChange}
//         />

//         {/* Preview للصورة الحالية */}
//         <div style={{ marginTop: 10 }}>
//           <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
//             Current Image
//           </div>
//           {form.image_url ? (
//             <img
//               src={`http://localhost:5000${form.image_url}`}
//               alt="current"
//               style={{
//                 width: "100%",
//                 maxHeight: 220,
//                 objectFit: "contain",
//                 borderRadius: 10,
//                 border: "2px solid #f1d7b0",
//                 background: "#fff",
//               }}
//             />
//           ) : (
//             <div style={{ padding: 12, background: "#fafafa", borderRadius: 8 }}>
//               No image
//             </div>
//           )}
//         </div>

//         {/* اختيار صورة جديدة */}
//         <input
//           type="file"
//           accept="image/*"
//           onChange={handleFileChange}
//           style={{ marginTop: 10 }}
//         />
//         {file && <small>Selected: {file.name}</small>}

//         <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
//           <button onClick={handleSubmit} disabled={uploading}>
//             {uploading ? "Saving..." : "Save"}
//           </button>
//           <button onClick={onClose} disabled={uploading}>
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditProductModal;
import React, { useEffect, useState, useRef } from "react";
import { uploadProductImage } from "../../services/storeService";
import "../../store_sp.css";

const EditProductModal = ({ open, onClose, product, onSubmit }) => {
  const [form, setForm] = useState({
    name: "",
    category: "Shoes",
    price: "",
    stock_qty: "",
    image_url: "",
  });

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const modalRef = useRef(null);

  // Auto-scroll to modal when it opens
  useEffect(() => {
    if (open && modalRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        // Scroll to the top of the page first
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        
        // Then wait and scroll the modal into view
        setTimeout(() => {
          if (modalRef.current) {
            modalRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 100);
      }, 50);
    }
  }, [open]);

  // Fill form when product changes
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        category: product.category || "Shoes",
        price: product.price ?? "",
        stock_qty: product.stock_qty ?? "",
        image_url: product.image_url || "",
      });
      setFile(null);
    }
  }, [product]);

  if (!open || !product) return null;

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);

      let image_url = form.image_url;

      // If a new image is selected → upload and get new URL
      if (file) {
        const uploadRes = await uploadProductImage(file);
        image_url = uploadRes.image_url;
      }

      await onSubmit(product.product_id, {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        stock_qty: Number(form.stock_qty),
        image_url,
      });

      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update product");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className="store-modal-backdrop" 
      onClick={onClose}
      ref={modalRef}
      style={{
        display: open ? 'flex' : 'none'
      }}
    >
      <div
        className="store-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: 520, 
          maxWidth: "95vw",
          maxHeight: "85vh",
          overflowY: "auto"
        }}
      >
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: 25,
          color: '#1e8c6f',
          borderBottom: '2px solid #f1d7b0',
          paddingBottom: 10
        }}>
          Edit Product
        </h2>

        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 'bold',
            color: '#555'
          }}>
            Product Name
          </label>
          <input
            name="name"
            placeholder="Product name"
            value={form.name}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 'bold',
            color: '#555'
          }}>
            Category
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              backgroundColor: 'white'
            }}
          >
            <option value="Shoes">Shoes</option>
            <option value="Clothes">Clothes</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 'bold',
            color: '#555'
          }}>
            Price ($)
          </label>
          <input
            name="price"
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 'bold',
            color: '#555'
          }}>
            Stock Quantity
          </label>
          <input
            name="stock_qty"
            placeholder="Quantity"
            type="number"
            value={form.stock_qty}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Current Image Preview */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 'bold',
            color: '#555'
          }}>
            Current Image
          </label>
          {form.image_url ? (
            <img
              src={`http://localhost:5000${form.image_url}`}
              alt="current"
              style={{
                width: "100%",
                maxHeight: 220,
                objectFit: "contain",
                borderRadius: 10,
                border: "2px solid #f1d7b0",
                background: "#fff",
                padding: 10,
                boxSizing: 'border-box'
              }}
            />
          ) : (
            <div style={{ 
              padding: 40, 
              background: "#fafafa", 
              borderRadius: 8,
              textAlign: 'center',
              color: '#888',
              border: '2px dashed #ddd'
            }}>
              No image available
            </div>
          )}
        </div>

        {/* New Image Selection */}
        <div style={{ marginBottom: 25 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 'bold',
            color: '#555'
          }}>
            Change Image (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: 'white'
            }}
          />
          {file && (
            <small style={{ 
              display: 'block', 
              marginTop: 5,
              color: '#1e8c6f',
              fontWeight: '500'
            }}>
              Selected: {file.name}
            </small>
          )}
        </div>

        <div style={{ 
          display: "flex", 
          gap: 12,
          marginTop: 20,
          paddingTop: 20,
          borderTop: '1px solid #eee'
        }}>
          <button 
            onClick={handleSubmit} 
            disabled={uploading}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: uploading ? '#ccc' : '#1e8c6f',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? "Saving..." : "Save Changes"}
          </button>
          <button 
            onClick={onClose} 
            disabled={uploading}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: '#f5f5f5',
              color: '#555',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;