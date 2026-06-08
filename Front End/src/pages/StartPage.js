// Front_end/snp/src/pages/StartPage.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// Images
import sportsImage from '../assets/images/4_sports.png';
import gamingImage from '../assets/images/gaming_setup.png';
import gymImage from '../assets/images/gym_center.png';
import clothesImage from '../assets/images/clothes_store.png';
import mainLogo from '../assets/images/logo_snp.png';

// ✅ Sticker image
import jobSticker from '../assets/images/job-sticker.png';

// Floating sticker component
import ApplyJobStickerMarquee from '../components/home/ApplyJobStickerMarquee';

const API = 'http://localhost:5000/api';

const StartPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hiringOpen, setHiringOpen] = useState(false); // ← controls sticker visibility
  const navigate = useNavigate();

  const features = [
    {
      image: sportsImage,
      title: 'Multi-Sports Facilities',
      description: 'Football, Basketball, Tennis & more professional courts',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      image: gymImage,
      title: 'Premium Gym Center',
      description: 'State-of-the-art equipment & professional trainers',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      image: gamingImage,
      title: 'Gaming Paradise',
      description: 'High-end gaming setups & latest consoles',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      image: clothesImage,
      title: 'Sport Fashion Store',
      description: 'Latest sports apparel & equipment',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  ];

  // Intro animation + hero slider
  useEffect(() => {
    setIsVisible(true);
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(slideInterval);
  }, [features.length]);

  // 🔄 Load hiring flag (same source as the old button)
  useEffect(() => {
    const fetchHiring = async () => {
      try {
        const r = await fetch(`${API}/settings/hiring`);
        const data = await r.json();
        setHiringOpen(Boolean(data.hiring_open));
      } catch {
        setHiringOpen(false);
      }
    };
    fetchHiring();

    // Optional: refresh occasionally so toggling in the Dashboard reflects here
    const id = setInterval(fetchHiring, 15000);
    return () => clearInterval(id);
  }, []);

  const handleLaunchSystem = () => navigate('/login');

  return (
    <div
      className="min-vh-100 text-white position-relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Background particles / orbs */}
      <div className="position-absolute w-100 h-100">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="position-absolute rounded-circle"
            style={{
              width: Math.random() * 6 + 2 + 'px',
              height: Math.random() * 6 + 2 + 'px',
              background: `rgba(255, 255, 255, ${Math.random() * 0.3})`,
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
              animationDelay: Math.random() * 5 + 's',
            }}
          />
        ))}

        <div
          className="position-absolute rounded-circle"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
            top: '10%',
            left: '-10%',
            animation: 'pulse 8s infinite ease-in-out',
          }}
        />
        <div
          className="position-absolute rounded-circle"
          style={{
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, transparent 70%)',
            bottom: '-5%',
            right: '-5%',
            animation: 'pulse 6s infinite ease-in-out reverse',
          }}
        />
      </div>

      <Container className="position-relative z-2">
        {/* Header */}
        <Row className="py-4">
          <Col className="text-center">
            <img src={mainLogo} alt="Sport Zone" style={{ height: '80px', width: 'auto' }} className="mb-3" />
            <h1 className="display-4 fw-bold mb-2 text-warning">SPORT ZONE</h1>
            <p className="lead text-light opacity-75">Where Champions Train & Dreams Become Reality</p>
          </Col>
        </Row>

        {/* Main content */}
        <Row className="align-items-center min-vh-75 py-5">
          <Col lg={6} className={`text-center text-lg-start ${isVisible ? 'slide-in-left' : ''}`}>
            <h2 className="display-3 fw-bold mb-4 text-white">
              Ultimate Sports <span className="d-block gradient-text">Experience</span>
            </h2>

            <p className="lead mb-4 text-light opacity-85 fs-5">
              Discover the future of sports entertainment. From professional training facilities to cutting-edge gaming
              zones and premium sportswear — everything you need in one revolutionary platform.
            </p>

            {/* Dots */}
            <div className="d-flex justify-content-center justify-content-lg-start gap-4 mb-5">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`rounded-circle ${currentSlide === index ? 'pulse-active' : 'pulse-inactive'}`}
                  style={{
                    width: '12px',
                    height: '12px',
                    background: currentSlide === index ? '#667eea' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start position-relative">
              <Button
                onClick={handleLaunchSystem}
                variant="outline-light"
                size="lg"
                className="px-5 py-3 fw-bold border-2 btn-hover-glow position-relative"
                style={{ background: 'transparent', transition: 'all 0.3s ease', cursor: 'pointer', zIndex: 100 }}
              >
                🚀 Launch System
              </Button>
              {/* (Old Apply button removed — sticker below replaces it) */}
            </div>
          </Col>

          <Col lg={6} className={`position-relative ${isVisible ? 'slide-in-right' : ''}`}>
            {/* Image gallery */}
            <div className="position-relative" style={{ height: '500px' }}>
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`position-absolute w-100 h-100 border-0 overflow-hidden transition-all ${
                    currentSlide === index ? 'active-slide' : 'inactive-slide'
                  }`}
                  style={{
                    background: feature.color,
                    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'none',
                  }}
                >
                  <div className="position-relative h-100">
                    <div
                      className="w-100 h-100"
                      style={{ background: `url(${feature.image}) center/contain no-repeat`, opacity: 1 }}
                    />
                    <div className="position-absolute bottom-0 start-0 end-0 p-4 text-white text-center">
                      <h4 className="fw-bold mb-2 text-shadow">{feature.title}</h4>
                      <p className="mb-0 opacity-90 text-shadow">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Arrows */}
              <Button
                variant="outline-light"
                className="position-absolute top-50 start-0 translate-middle-y rounded-circle border-0 position-relative"
                style={{ width: '50px', height: '50px', background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
                onClick={() => setCurrentSlide((prev) => (prev - 1 + features.length) % features.length)}
                aria-label="Previous"
              >
                ‹
              </Button>
              <Button
                variant="outline-light"
                className="position-absolute top-50 end-0 translate-middle-y rounded-circle border-0 position-relative"
                style={{ width: '50px', height: '50px', background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
                onClick={() => setCurrentSlide((prev) => (prev + 1) % features.length)}
                aria-label="Next"
              >
                ›
              </Button>
            </div>
          </Col>
        </Row>

        {/* Floating sticker band — only show when Hiring is ON */}
        {/* {hiringOpen && (
          <Row className="pb-5">
            <Col>
              <ApplyJobStickerMarquee
                imageSrc={jobSticker}
                height={140}
                speedMs={12000}
                shadow
                to="/apply" // click → ApplyJob page
              />
            </Col>
          </Row>
        )} */}

        {/* Quick stats */}
        <Row className="py-5 mt-3">
          <Col className="text-center">
            <div className="d-flex justify-content-center gap-5 flex-wrap">
              <div className="text-center">
                <div className="fs-2 fw-bold text-warning mb-1">50+</div>
                <div className="text-light opacity-75">Sports Activities</div>
              </div>
              <div className="text-center">
                <div className="fs-2 fw-bold text-info mb-1">1000+</div>
                <div className="text-light opacity-75">Happy Members</div>
              </div>
              <div className="text-center">
                <div className="fs-2 fw-bold text-success mb-1">24/7</div>
                <div className="text-light opacity-75">Facility Access</div>
              </div>
              <div className="text-center">
                <div className="fs-2 fw-bold text-danger mb-1">5★</div>
                <div className="text-light opacity-75">Customer Rating</div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Animations CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .slide-in-left { animation: slideInLeft 1s ease-out; }
        .slide-in-right { animation: slideInRight 1s ease-out; }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .active-slide { opacity: 1; transform: scale(1) rotate(0deg); z-index: 10; }
        .inactive-slide { opacity: 0; transform: scale(0.8) rotate(5deg); z-index: 1; }
        .transition-all { transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-hover-glow:hover { box-shadow: 0 0 20px rgba(255, 255, 255, 0.5); transform: translateY(-2px); }
        .pulse-active { animation: pulse 2s infinite; }
        .pulse-inactive { animation: none; }
        .text-shadow { text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8); }
      `}</style>
    </div>
  );
};

export default StartPage;
