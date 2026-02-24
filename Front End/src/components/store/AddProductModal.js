// import React, { useEffect, useState } from "react";
// import { uploadProductImage } from "../../services/storeService";

// const AddProductModal = ({ open, onClose, onSubmit }) => {
//   const emptyForm = {
//     name: "",
//     category: "Shoes",
//     price: "",
//     stock_qty: "",
//     store_id: "",
//   };

//   const [form, setForm] = useState(emptyForm);
//   const [file, setFile] = useState(null);
//   const [uploading, setUploading] = useState(false);

//   // reset form whenever modal opens
//   useEffect(() => {
//     if (open) {
//       setForm(emptyForm);
//       setFile(null);
//       setUploading(false);
//     }
//     // eslint-disable-next-line
//   }, [open]);

//   // close on ESC
//   useEffect(() => {
//     if (!open) return;
//     const onKeyDown = (e) => {
//       if (e.key === "Escape") onClose();
//     };
//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [open, onClose]);

//   if (!open) return null;

//   const handleChange = (e) =>
//     setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

//   const handleFileChange = (e) => {
//     const selected = e.target.files?.[0];
//     setFile(selected || null);
//   };

//   const handleSubmit = async () => {
//     try {
//       setUploading(true);

//       let image_url = null;

//       // 1) upload image if exists
//       if (file) {
//         const uploadRes = await uploadProductImage(file);
//         image_url = uploadRes.image_url;
//       }

//       // 2) submit product with image_url
//       await onSubmit({
//         ...form,
//         price: Number(form.price),
//         stock_qty: Number(form.stock_qty),
//         store_id: form.store_id ? Number(form.store_id) : null,
//         image_url,
//       });

//       onClose();
//     } catch (err) {
//       console.error(err);
//       alert("Image upload failed");
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div
//       className="store-modal-backdrop"
//       onClick={() => !uploading && onClose()}
//     >
//       <div className="store-modal" onClick={(e) => e.stopPropagation()}>
//         <h2>Add Product</h2>

//         <input
//           name="name"
//           placeholder="Product name"
//           value={form.name}
//           onChange={handleChange}
//         />

//         <select name="category" value={form.category} onChange={handleChange}>
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

//         <input
//           name="store_id"
//           placeholder="Store ID (optional)"
//           value={form.store_id}
//           onChange={handleChange}
//         />

//         {/* image input */}
//         <input type="file" accept="image/*" onChange={handleFileChange} />
//         {file && <small>Selected: {file.name}</small>}

//         <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
//           <button onClick={handleSubmit} disabled={uploading}>
//             {uploading ? "Uploading..." : "Add"}
//           </button>
//           <button onClick={onClose} disabled={uploading}>
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddProductModal;

import React, { useEffect, useState } from "react";
import { uploadProductImage } from "../../services/storeService";

const AddProductModal = ({ open, onClose, onSubmit }) => {
  const emptyForm = {
    name: "",
    category: "Shoes",
    price: "",
    stock_qty: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // reset form whenever modal opens
  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setFile(null);
      setUploading(false);
    }
    // eslint-disable-next-line
  }, [open]);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);

      let image_url = null;

      // 1) upload image if exists
      if (file) {
        const uploadRes = await uploadProductImage(file);
        image_url = uploadRes.image_url;
      }

      // 2) submit product with image_url (NO IDs)
      await onSubmit({
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        stock_qty: Number(form.stock_qty),
        image_url,
      });

      onClose();
    } catch (err) {
      console.error(err);
      alert("Add product failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="store-modal-backdrop"
      onClick={() => !uploading && onClose()}
    >
      <div className="store-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Product</h2>

        <input
          name="name"
          placeholder="Product name"
          value={form.name}
          onChange={handleChange}
        />

        <select name="category" value={form.category} onChange={handleChange}>
          <option value="Shoes">Shoes</option>
          <option value="Clothes">Clothes</option>
          <option value="Accessories">Accessories</option>
        </select>

        <input
          name="price"
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={handleChange}
        />

        <input
          name="stock_qty"
          placeholder="Quantity"
          type="number"
          value={form.stock_qty}
          onChange={handleChange}
        />

        {/* image input */}
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {file && <small>Selected: {file.name}</small>}

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Uploading..." : "Add"}
          </button>
          <button onClick={onClose} disabled={uploading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
