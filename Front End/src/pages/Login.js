// import React, { useState } from 'react';
// import { 
//   Form, 
//   Button, 
//   Card, 
//   Container, 
//   Row, 
//   Col, 
//   Alert,
//   Navbar
// } from 'react-bootstrap';
// import { useAuth } from '../context/AuthContext';
// import { authService } from '../services/authService';
// import { useNavigate, Link } from 'react-router-dom';

// // Import your logo
// import sportZoneLogo from '../assets/images/logo_snp.png';

// const Login = () => {
//   const [formData, setFormData] = useState({
//     email: '',
//     password: ''
//   });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const response = await authService.login(formData.email, formData.password);
      
//       // Store login timestamp for session management (sessionStorage so it clears on browser close)
//       sessionStorage.setItem('loginTime', Date.now().toString());
      
//       // Use the login function from AuthContext (handles persistence in sessionStorage)
//       await login(response.user, response.token);
      
//       // ✅ Explicit navigation to dashboard after successful login
//       console.log('✅ Login successful, redirecting to dashboard...');
//       navigate('/dashboard');
      
//     } catch (err) {
//       console.error('❌ Login error:', err);
//       setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      
//       // Clear any stale tokens on login failure
//       sessionStorage.removeItem('token');
//       sessionStorage.removeItem('user');
//       sessionStorage.removeItem('loginTime');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       {/* Navigation Bar */}
//       <Navbar bg="dark" variant="dark" className="px-3">
//         <Navbar.Brand href="#" className="d-flex align-items-center">
//           <img 
//             src={sportZoneLogo} 
//             alt="Sport Zone" 
//             height="30" 
//             className="me-2"
//           />
//           <strong>SPORT ZONE</strong>
//         </Navbar.Brand>
//         <div className="ms-auto">
//           <span className="text-light me-3">Staff Portal</span>
//         </div>
//       </Navbar>

//       {/* Main Content */}
//       <div 
//         className="min-vh-100 d-flex align-items-center"
//         style={{
//           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//           backgroundSize: 'cover'
//         }}
//       >
//         <Container>
//           <Row className="justify-content-center">
//             <Col md={8} lg={6} xl={5}>
//               <Card className="shadow-lg border-0">
//                 <Card.Body className="p-5">
//                   {/* Header with Your Logo */}
//                   <div className="text-center mb-4">
//                     <img 
//                       src={sportZoneLogo} 
//                       alt="Sport Zone" 
//                       className="mb-3"
//                       style={{ height: '80px', width: 'auto' }}
//                     />
//                     <h2 className="fw-bold text-dark mb-1">Sport Zone</h2>
//                     <p className="text-muted">Staff Management System</p>
//                   </div>
                  
//                   {/* Error Alert */}
//                   {error && (
//                     <Alert variant="danger" className="text-center">
//                       <i className="bi bi-exclamation-triangle-fill me-2"></i>
//                       {error}
//                     </Alert>
//                   )}
                  
//                   {/* Login Form */}
//                   <Form onSubmit={handleSubmit}>
//                     <Form.Group className="mb-3">
//                       <Form.Label className="fw-semibold">
//                         <i className="bi bi-envelope me-2"></i>
//                         Email Address
//                       </Form.Label>
//                       <Form.Control
//                         type="email"
//                         name="email"
//                         value={formData.email}
//                         onChange={handleChange}
//                         placeholder="Enter your staff email"
//                         required
//                         className="py-2"
//                       />
//                     </Form.Group>

//                     <Form.Group className="mb-4">
//                       <Form.Label className="fw-semibold">
//                         <i className="bi bi-lock me-2"></i>
//                         Password
//                       </Form.Label>
//                       <Form.Control
//                         type="password"
//                         name="password"
//                         value={formData.password}
//                         onChange={handleChange}
//                         placeholder="Enter your password"
//                         required
//                         className="py-2"
//                       />
//                     </Form.Group>

//                     <Button 
//                       variant="primary" 
//                       type="submit" 
//                       className="w-100 py-2 fw-semibold" 
//                       disabled={loading}
//                       size="lg"
//                     >
//                       {loading ? (
//                         <>
//                           <span className="spinner-border spinner-border-sm me-2" role="status"></span>
//                           Signing in...
//                         </>
//                       ) : (
//                         <>
//                           <i className="bi bi-box-arrow-in-right me-2"></i>
//                           Sign In
//                         </>
//                       )}
//                     </Button>
//                   </Form>

//                   {/* Divider */}
//                   <div className="text-center my-4">
//                     <hr />
//                     <span className="px-3 text-muted bg-white">or</span>
//                   </div>

//                   {/* Register Link */}
//                   <div className="text-center">
//                     <p className="mb-2">Need a staff account?</p>
//                     <Link 
//                       to="/register" 
//                       className="btn btn-outline-primary btn-sm"
//                     >
//                       <i className="bi bi-person-plus me-1"></i>
//                       Create Staff Account
//                     </Link>
//                   </div>
//                 </Card.Body>
//               </Card>

//               {/* Footer */}
//               <div className="text-center mt-4">
//                 <p className="text-white mb-0">
//                   &copy; 2024 Sport Zone Management System
//                 </p>
//                 <small className="text-white-50">
//                   Staff Portal v1.0
//                 </small>
//               </div>
//             </Col>
//           </Row>
//         </Container>
//       </div>
//     </>
//   );
// };

// export default Login;
import React, { useState } from 'react';
import { 
  Form, 
  Button, 
  Card, 
  Container, 
  Row, 
  Col, 
  Alert,
  Navbar
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';

// Import your logo
import sportZoneLogo from '../assets/images/logo_snp.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData.email, formData.password);
      
      // Store login timestamp for session management (sessionStorage so it clears on browser close)
      sessionStorage.setItem('loginTime', Date.now().toString());
      
      // Use the login function from AuthContext (handles persistence in sessionStorage)
      await login(response.user, response.token);
      
      // ✅ Explicit navigation to dashboard after successful login
      console.log('✅ Login successful, redirecting to dashboard...');
      navigate('/dashboard');
      
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      
      // Clear any stale tokens on login failure
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('loginTime');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Navigation Bar */}
      <Navbar bg="dark" variant="dark" className="px-3">
        <Navbar.Brand href="#" className="d-flex align-items-center">
          <img 
            src={sportZoneLogo} 
            alt="Sport Zone" 
            height="30" 
            className="me-2"
          />
          <strong>SPORT ZONE</strong>
        </Navbar.Brand>
        <div className="ms-auto">
          <span className="text-light me-3">Staff Portal</span>
        </div>
      </Navbar>

      {/* Main Content */}
      <div 
        className="min-vh-100 d-flex align-items-center"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover'
        }}
      >
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="shadow-lg border-0">
                <Card.Body className="p-5">
                  {/* Header with Your Logo */}
                  <div className="text-center mb-4">
                    <img 
                      src={sportZoneLogo} 
                      alt="Sport Zone" 
                      className="mb-3"
                      style={{ height: '80px', width: 'auto' }}
                    />
                    <h2 className="fw-bold text-dark mb-1">Sport Zone</h2>
                    <p className="text-muted">Staff Management System</p>
                  </div>
                  
                  {/* Error Alert */}
                  {error && (
                    <Alert variant="danger" className="text-center">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </Alert>
                  )}
                  
                  {/* Login Form */}
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <i className="bi bi-envelope me-2"></i>
                        Email Address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your staff email"
                        required
                        className="py-2"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold">
                        <i className="bi bi-lock me-2"></i>
                        Password
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        className="py-2"
                      />
                    </Form.Group>

                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="w-100 py-2 fw-semibold" 
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Signing in...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Sign In
                        </>
                      )}
                    </Button>
                  </Form>

                  {/* Divider - Commented out to hide
                  <div className="text-center my-4">
                    <hr />
                    <span className="px-3 text-muted bg-white">or</span>
                  </div> */}

                  {/* Register Link - Commented out to hide
                  <div className="text-center">
                    <p className="mb-2">Need a staff account?</p>
                    <Link 
                      to="/register" 
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-person-plus me-1"></i>
                      Create Staff Account
                    </Link>
                  </div> */}
                </Card.Body>
              </Card>

              {/* Footer */}
              <div className="text-center mt-4">
                <p className="text-white mb-0">
                  &copy; 2024 Sport Zone Management System
                </p>
                <small className="text-white-50">
                  Staff Portal v1.0
                </small>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Login;