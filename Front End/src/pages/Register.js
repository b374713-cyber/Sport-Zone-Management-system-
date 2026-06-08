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
import { authService } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';

// Import your special register images
import registerLogo from '../assets/images/register_logo_1.png';
import registerHero from '../assets/images/resister_spc_1.png';
import mainLogo from '../assets/images/logo_snp.png';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Employee'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Track progress steps
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...userData } = formData;
      await authService.register(userData);
      alert('🎉 Staff account created successfully! Please login.');
      navigate('/login'); // Redirect to login page
      setCurrentStep(3); // Mark as complete (optional visual)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Dark Navigation Bar */}
      <Navbar bg="dark" variant="dark" className="px-3">
        <Navbar.Brand href="#" className="d-flex align-items-center">
          <img 
            src={mainLogo} 
            alt="Sport Zone" 
            height="35" 
            className="me-2"
          />
          <strong>SPORT ZONE</strong>
        </Navbar.Brand>
        <div className="ms-auto">
          <span className="text-light me-3">Staff Registration</span>
        </div>
      </Navbar>

      {/* Dark Background Layout */}
      <div 
        className="min-vh-100"
        style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          padding: '2rem 0'
        }}
      >
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card className="border-0 shadow-lg overflow-hidden">
                <Row className="g-0">
                  {/* Left Side - Hero Section with Dark Background */}
                  <Col lg={6} className="d-none d-lg-block">
                    <div 
                      className="h-100 d-flex align-items-center justify-content-center p-5 text-white"
                      style={{
                        background: 'linear-gradient(135deg, rgba(30, 60, 114, 0.9) 0%, rgba(42, 82, 152, 0.9) 100%)',
                        position: 'relative'
                      }}
                    >
                      {/* Background Pattern */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `
                            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)
                          `,
                        }}
                      ></div>
                      
                      {/* Hero Content */}
                      <div className="text-center position-relative z-1">
                        <img 
                          src={registerHero} 
                          alt="Join Our Team" 
                          className="mb-4 rounded-circle shadow"
                          style={{ 
                            width: '180px', 
                            height: '180px', 
                            objectFit: 'cover',
                            border: '4px solid rgba(255,255,255,0.3)'
                          }}
                        />
                        <h3 className="fw-bold mb-3">Welcome to the Team!</h3>
                        <p className="mb-4 opacity-75">
                          Join Sport Zone's professional staff and help us deliver 
                          exceptional sports experiences to our customers.
                        </p>
                        
                        {/* Features List */}
                        <div className="text-start">
                          <div className="d-flex align-items-center mb-3">
                            <i className="bi bi-check-circle-fill text-success me-3 fs-5"></i>
                            <span>Manage sports facilities</span>
                          </div>
                          <div className="d-flex align-items-center mb-3">
                            <i className="bi bi-check-circle-fill text-success me-3 fs-5"></i>
                            <span>Handle customer bookings</span>
                          </div>
                          <div className="d-flex align-items-center mb-3">
                            <i className="bi bi-check-circle-fill text-success me-3 fs-5"></i>
                            <span>Access staff dashboard</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Right Side - Registration Form */}
                  <Col lg={6}>
                    <div className="p-5">
                      {/* Header */}
                      <div className="text-center mb-4">
                        <img 
                          src={registerLogo} 
                          alt="Sport Zone Register" 
                          className="mb-3"
                          style={{ height: '70px', width: 'auto' }}
                        />
                        <h3 className="fw-bold text-dark mb-2">Staff Registration</h3>
                        <p className="text-muted">
                          Create your staff account in 3 simple steps
                        </p>
                      </div>

                      {/* Progress Steps */}
                      <div className="d-flex justify-content-between align-items-center mb-5 px-2">
                        {/* Step 1: Account */}
                        <div className="text-center flex-fill">
                          <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${
                            currentStep >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'
                          }`}
                            style={{ width: '45px', height: '45px' }}>
                            <strong>1</strong>
                          </div>
                          <div>
                            <small className={`fw-semibold ${currentStep >= 1 ? 'text-primary' : 'text-muted'}`}>
                              Account
                            </small>
                          </div>
                        </div>

                        <div className={`flex-grow-1 border-top mx-2 ${currentStep >= 2 ? 'border-primary' : 'border-light'}`}></div>

                        {/* Step 2: Profile */}
                        <div className="text-center flex-fill">
                          <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${
                            currentStep >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'
                          }`}
                            style={{ width: '45px', height: '45px' }}>
                            <strong>2</strong>
                          </div>
                          <div>
                            <small className={`fw-semibold ${currentStep >= 2 ? 'text-primary' : 'text-muted'}`}>
                              Profile
                            </small>
                          </div>
                        </div>

                        <div className={`flex-grow-1 border-top mx-2 ${currentStep >= 3 ? 'border-primary' : 'border-light'}`}></div>

                        {/* Step 3: Complete */}
                        <div className="text-center flex-fill">
                          <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${
                            currentStep >= 3 ? 'bg-primary text-white' : 'bg-light text-muted'
                          }`}
                            style={{ width: '45px', height: '45px' }}>
                            <strong>3</strong>
                          </div>
                          <div>
                            <small className={`fw-semibold ${currentStep >= 3 ? 'text-primary' : 'text-muted'}`}>
                              Complete
                            </small>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <Alert variant="danger" className="text-center">
                          <i className="bi bi-shield-exclamation me-2"></i>
                          {error}
                        </Alert>
                      )}

                      <Form onSubmit={handleSubmit}>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-semibold small text-uppercase text-muted">
                                Full Name *
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                                className="py-3 border-0 bg-light"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-semibold small text-uppercase text-muted">
                                Staff Role *
                              </Form.Label>
                              <Form.Select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="py-3 border-0 bg-light"
                              >
                                <option value="Employee">👨‍💼 Team Member</option>
                                <option value="Admin">👑 Administrator</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold small text-uppercase text-muted">
                            Email Address *
                          </Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="staff@sportzone.com"
                            required
                            className="py-3 border-0 bg-light"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold small text-uppercase text-muted">
                            Phone Number
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+966 55 123 4567"
                            className="py-3 border-0 bg-light"
                          />
                        </Form.Group>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-semibold small text-uppercase text-muted">
                                Password *
                              </Form.Label>
                              <Form.Control
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="py-3 border-0 bg-light"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-4">
                              <Form.Label className="fw-semibold small text-uppercase text-muted">
                                Confirm Password *
                              </Form.Label>
                              <Form.Control
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="py-3 border-0 bg-light"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Button 
                          variant="primary" 
                          type="submit" 
                          className="w-100 py-3 fw-bold" 
                          disabled={loading}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            fontSize: '1.1em'
                          }}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Creating Account...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-person-plus-fill me-2"></i>
                              Complete Registration
                            </>
                          )}
                        </Button>
                      </Form>

                      <div className="text-center mt-4">
                        <p className="text-muted mb-0">
                          Already have an account?{' '}
                          <Link 
                            to="/login"  // redirect to login
                            className="text-primary text-decoration-none fw-semibold"
                          >
                            Sign in here
                          </Link>
                        </p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Register;
