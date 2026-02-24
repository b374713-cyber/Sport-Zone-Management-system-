// src/components/store/StoreIntroCarousel.js
import React, { useEffect, useState } from "react";
import "../../store_sp.css";

// حطي صورك هون (بعد ما أضفتيهم بالassets)
import c1 from "../../assets/store/c1.jpg";
import c2 from "../../assets/store/c2.jpg";
import c3 from "../../assets/store/c3.jpg";
import c4 from "../../assets/store/c4.jpg";
import c5 from "../../assets/store/c5.jpg";
import c6 from "../../assets/store/c6.jpg";
import c7 from "../../assets/store/c7.jpg";
import c8 from "../../assets/store/c8.jpg";
import c9 from "../../assets/store/c9.jpg";
import c10 from "../../assets/store/c10.jpg";

const images = [c1,c2,c3,c4,c5,c6,c7,c8,c9,c10];

const StoreIntroCarousel = ({ onContinue }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const handleClick = () => {
    // optional chaining حتى ما يطلع error
    onContinue?.();
  };

  return (
    <div className="store-intro-bg" onClick={handleClick}>
      <div className="store-intro-wrapper">
        <img
          src={images[index]}
          alt="store intro"
          className="store-intro-image"
        />
        <div className="store-intro-overlay">
          <div className="store-intro-text">Click anywhere to continue</div>
        </div>
      </div>
    </div>
  );
};

export default StoreIntroCarousel;
