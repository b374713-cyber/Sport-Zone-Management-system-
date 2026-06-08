// // // Front_end/snp/src/pages/ApplyJob.js
// // import React, { useState } from "react";
// // import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from "react-bootstrap";
// // import { useNavigate } from "react-router-dom";

// // const RAW_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
// // const API = RAW_BASE.endsWith("/api")
// //   ? RAW_BASE
// //   : `${RAW_BASE.replace(/\/$/, "")}/api`;

// // export default function ApplyJob() {
// //   const navigate = useNavigate();

// //   const [form, setForm] = useState({
// //     full_name: "",
// //     email: "",
// //     phone: "",
// //     cv_link: ""
// //   });
// //   const [cvImage, setCvImage] = useState(null); // image file
// //   const [submitting, setSubmitting] = useState(false);
// //   const [message, setMessage] = useState("");
// //   const [error, setError] = useState("");

// //   const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

// //   const onSubmit = async (e) => {
// //     e.preventDefault();
// //     setMessage("");
// //     setError("");
// //     try {
// //       setSubmitting(true);

// //       // Use multipart form to support optional image upload
// //       const body = new FormData();
// //       body.append("full_name", form.full_name);
// //       body.append("email", form.email);
// //       body.append("phone", form.phone || "");
// //       body.append("cv_link", form.cv_link || "");
// //       if (cvImage) body.append("cv_image", cvImage);

// //       const res = await fetch(`${API}/jobs/apply`, {
// //         method: "POST",
// //         body
// //       });
// //       const data = await res.json();
// //       if (!res.ok) throw new Error(data.error || "Submit failed");

// //       setMessage("✅ Application submitted! We will review it soon.");
// //       setForm({ full_name: "", email: "", phone: "", cv_link: "" });
// //       setCvImage(null);
// //     } catch (err) {
// //       setError(err.message || "❌ Failed to submit. Please try again.");
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   return (
// //     <Container className="py-4">
// //       <Row className="mb-3">
// //         <Col className="d-flex justify-content-between align-items-center">
// //           <h2 className="mb-0">Apply for a Job at Sport Zone</h2>
// //           <Button variant="outline-secondary" onClick={() => navigate("/")}>
// //             ← Back to Start
// //           </Button>
// //         </Col>
// //       </Row>

// //       {message && <Alert variant="success">{message}</Alert>}
// //       {error && <Alert variant="danger">{error}</Alert>}

// //       <Card className="shadow-sm">
// //         <Card.Body>
// //           <Form onSubmit={onSubmit}>
// //             <Row>
// //               <Col md={6}>
// //                 <Form.Group className="mb-3">
// //                   <Form.Label>Full name</Form.Label>
// //                   <Form.Control
// //                     name="full_name"
// //                     value={form.full_name}
// //                     onChange={onChange}
// //                     required
// //                   />
// //                 </Form.Group>
// //               </Col>
// //               <Col md={6}>
// //                 <Form.Group className="mb-3">
// //                   <Form.Label>Email</Form.Label>
// //                   <Form.Control
// //                     type="email"
// //                     name="email"
// //                     value={form.email}
// //                     onChange={onChange}
// //                     required
// //                   />
// //                 </Form.Group>
// //               </Col>
// //             </Row>

// //             <Row>
// //               <Col md={6}>
// //                 <Form.Group className="mb-3">
// //                   <Form.Label>Phone</Form.Label>
// //                   <Form.Control
// //                     name="phone"
// //                     value={form.phone}
// //                     onChange={onChange}
// //                   />
// //                 </Form.Group>
// //               </Col>
// //               <Col md={6}>
// //                 <Form.Group className="mb-2">
// //                   <Form.Label>CV Image (preferred)</Form.Label>
// //                   <Form.Control
// //                     type="file"
// //                     accept="image/*"
// //                     onChange={(e) => setCvImage(e.target.files?.[0] || null)}
// //                   />
// //                   <Form.Text className="text-muted">
// //                     JPG/PNG recommended. Max a few MB.
// //                   </Form.Text>
// //                 </Form.Group>

// //                 <div className="text-center text-muted">or</div>

// //                 <Form.Group className="mt-2">
// //                   <Form.Label>CV Link (optional)</Form.Label>
// //                   <Form.Control
// //                     name="cv_link"
// //                     placeholder="https://drive.google.com/..."
// //                     value={form.cv_link}
// //                     onChange={onChange}
// //                   />
// //                 </Form.Group>
// //               </Col>
// //             </Row>

// //             <div className="d-flex gap-2 mt-2">
// //               <Button type="submit" disabled={submitting}>
// //                 {submitting ? <Spinner size="sm" animation="border" /> : "Submit Application"}
// //               </Button>
// //               <Button variant="outline-secondary" onClick={() => navigate("/")}>
// //                 Cancel
// //               </Button>
// //             </div>
// //           </Form>
// //         </Card.Body>
// //       </Card>
// //     </Container>
// //   );
// // }
// // Front_end/snp/src/pages/ApplyJob.js
// import React, { useState } from "react";
// import {
//   Container,
//   Row,
//   Col,
//   Card,
//   Button,
//   Form,
//   Alert,
//   Spinner
// } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";

// const RAW_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
// const API = RAW_BASE.endsWith("/api")
//   ? RAW_BASE
//   : `${RAW_BASE.replace(/\/$/, "")}/api`;

// export default function ApplyJob() {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     full_name: "",
//     email: "",
//     phone: "",
//     cv_link: ""
//   });
//   const [cvImage, setCvImage] = useState(null); // image file
//   const [submitting, setSubmitting] = useState(false);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");

//   const onChange = (e) =>
//     setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     setMessage("");
//     setError("");

//     try {
//       setSubmitting(true);

//       // Use multipart form to support optional image upload
//       const body = new FormData();
//       body.append("full_name", form.full_name);
//       body.append("email", form.email);
//       body.append("phone", form.phone || "");
//       body.append("cv_link", form.cv_link || "");
//       if (cvImage) body.append("cv_image", cvImage);

//       const res = await fetch(`${API}/jobs/apply`, {
//         method: "POST",
//         headers: {
//           // ✅ IMPORTANT for ngrok: prevents the warning/interstitial HTML
//           "ngrok-skip-browser-warning": "true"
//         },
//         body
//       });

//       // ✅ safer: handle cases where ngrok returns HTML not JSON
//       const text = await res.text();
//       let data = {};
//       try {
//         data = text ? JSON.parse(text) : {};
//       } catch (e) {
//         console.error("ApplyJob: Response not JSON:", text.slice(0, 200));
//         throw new Error("Server returned invalid response (not JSON).");
//       }

//       if (!res.ok) throw new Error(data.error || "Submit failed");

//       setMessage("✅ Application submitted! We will review it soon.");
//       setForm({ full_name: "", email: "", phone: "", cv_link: "" });
//       setCvImage(null);
//     } catch (err) {
//       setError(err.message || "❌ Failed to submit. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <Container className="py-4">
//       <Row className="mb-3">
//         <Col className="d-flex justify-content-between align-items-center">
//           <h2 className="mb-0">Apply for a Job at Sport Zone</h2>
//           <Button variant="outline-secondary" onClick={() => navigate("/")}>
//             ← Back to Start
//           </Button>
//         </Col>
//       </Row>

//       {message && <Alert variant="success">{message}</Alert>}
//       {error && <Alert variant="danger">{error}</Alert>}

//       <Card className="shadow-sm">
//         <Card.Body>
//           <Form onSubmit={onSubmit}>
//             <Row>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Full name</Form.Label>
//                   <Form.Control
//                     name="full_name"
//                     value={form.full_name}
//                     onChange={onChange}
//                     required
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Email</Form.Label>
//                   <Form.Control
//                     type="email"
//                     name="email"
//                     value={form.email}
//                     onChange={onChange}
//                     required
//                   />
//                 </Form.Group>
//               </Col>
//             </Row>

//             <Row>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Phone</Form.Label>
//                   <Form.Control
//                     name="phone"
//                     value={form.phone}
//                     onChange={onChange}
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={6}>
//                 <Form.Group className="mb-2">
//                   <Form.Label>CV Image (preferred)</Form.Label>
//                   <Form.Control
//                     type="file"
//                     accept="image/*"
//                     onChange={(e) => setCvImage(e.target.files?.[0] || null)}
//                   />
//                   <Form.Text className="text-muted">
//                     JPG/PNG recommended. Max a few MB.
//                   </Form.Text>
//                 </Form.Group>

//                 <div className="text-center text-muted">or</div>

//                 <Form.Group className="mt-2">
//                   <Form.Label>CV Link (optional)</Form.Label>
//                   <Form.Control
//                     name="cv_link"
//                     placeholder="https://drive.google.com/..."
//                     value={form.cv_link}
//                     onChange={onChange}
//                   />
//                 </Form.Group>
//               </Col>
//             </Row>

//             <div className="d-flex gap-2 mt-2">
//               <Button type="submit" disabled={submitting}>
//                 {submitting ? (
//                   <Spinner size="sm" animation="border" />
//                 ) : (
//                   "Submit Application"
//                 )}
//               </Button>
//               <Button variant="outline-secondary" onClick={() => navigate("/")}>
//                 Cancel
//               </Button>
//             </div>
//           </Form>
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// }
// Front_end/snp/src/pages/ApplyJob.js
import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Spinner
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const RAW_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API = RAW_BASE.endsWith("/api")
  ? RAW_BASE
  : `${RAW_BASE.replace(/\/$/, "")}/api`;

export default function ApplyJob() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    cv_link: ""
  });
  const [cvFile, setCvFile] = useState(null); // file (image or PDF)
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setSubmitting(true);

      // Use multipart form to support optional file upload
      const body = new FormData();
      body.append("full_name", form.full_name);
      body.append("email", form.email);
      body.append("phone", form.phone || "");
      body.append("cv_link", form.cv_link || "");
      if (cvFile) body.append("cv_image", cvFile); // Note: field name is still "cv_image" for compatibility

      const res = await fetch(`${API}/jobs/apply`, {
        method: "POST",
        headers: {
          // ✅ IMPORTANT for ngrok: prevents the warning/interstitial HTML
          "ngrok-skip-browser-warning": "true"
        },
        body
      });

      // ✅ safer: handle cases where ngrok returns HTML not JSON
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("ApplyJob: Response not JSON:", text.slice(0, 200));
        throw new Error("Server returned invalid response (not JSON).");
      }

      if (!res.ok) throw new Error(data.error || "Submit failed");

      setMessage("✅ Application submitted! We will review it soon.");
      setForm({ full_name: "", email: "", phone: "", cv_link: "" });
      setCvFile(null);
    } catch (err) {
      setError(err.message || "❌ Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-3">
        <Col className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Apply for a Job at Sport Zone</h2>
          <Button variant="outline-secondary" onClick={() => navigate("/")}>
            ← Back to Start
          </Button>
        </Col>
      </Row>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={onSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full name</Form.Label>
                  <Form.Control
                    name="full_name"
                    value={form.full_name}
                    onChange={onChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>CV File (preferred)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  />
                  <Form.Text className="text-muted">
                    JPG/PNG/PDF recommended. Max a few MB.
                  </Form.Text>
                </Form.Group>

                <div className="text-center text-muted">or</div>

                <Form.Group className="mt-2">
                  <Form.Label>CV Link (optional)</Form.Label>
                  <Form.Control
                    name="cv_link"
                    placeholder="https://drive.google.com/..."
                    value={form.cv_link}
                    onChange={onChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2 mt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  "Submit Application"
                )}
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}