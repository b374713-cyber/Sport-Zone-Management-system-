// import React from "react";
// import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
// import { router } from "expo-router";
// import { LinearGradient } from "expo-linear-gradient";
// import { Image } from "expo-image"; // ✅ GIFs smoothly
// import { Video, ResizeMode } from "expo-av"; // ✅ MP4 videos (ResizeMode enum)

// export default function StartScreen() {
//   return (
//     <LinearGradient
//       colors={["#071b2f", "#0b6fa5", "#1bb6d8"]}
//       style={styles.container}
//     >
//       {/* Top content */}
//       <View style={styles.content}>
//         {/* Logo */}
//         <Image
//           source={require("../assets/images/logo_snp.png")}
//           style={styles.logo}
//           contentFit="contain"
//         />

//         <Text style={styles.title}>Sport Zone</Text>
//         <Text style={styles.subtitle}>
//           Book stadiums, gym, gaming sessions, and reserve store items easily.
//         </Text>

//         {/* ✅ Small animated feature icons row */}
//         <View style={styles.featuresRow}>
//           <View style={styles.featureItem}>
//             <Image
//               source={require("../assets/animations/basketball.gif")}
//               style={styles.featureGif}
//               contentFit="contain"
//             />
//             <Text style={styles.featureText}>Sports</Text>
//           </View>

//           <View style={styles.featureItem}>
//             <Image
//               source={require("../assets/animations/stadiem.gif")}
//               style={styles.featureGif}
//               contentFit="contain"
//             />
//             <Text style={styles.featureText}>Matches</Text>
//           </View>

//           <View style={styles.featureItem}>
//             <Image
//               source={require("../assets/animations/controller2.gif")}
//               style={styles.featureGif}
//               contentFit="contain"
//             />
//             <Text style={styles.featureText}>Gaming</Text>
//           </View>
//         </View>

//         {/* Buttons */}
//         <View style={styles.buttonsContainer}>
//           <TouchableOpacity
//             style={styles.loginButton}
//             onPress={() => router.push("/login")}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.loginText}>Login</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.registerButton}
//             onPress={() => router.push("/register")}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.registerText}>Register</Text>
//           </TouchableOpacity>
//         </View>

//         {/* ✅ NEW: Row with left video, controller gif center, right video */}
//         <View style={styles.mediaRow}>
//           {/* Left video */}
//           <View style={styles.mediaBox}>
//             <Video
//               source={require("../assets/animations/system_gamig.mp4")}
//               style={styles.video}
//               resizeMode={ResizeMode.CONTAIN}
//               shouldPlay
//               isLooping
//               isMuted
//             />
//           </View>

//           {/* Center controller GIF */}
//           <View style={styles.controllerBox}>
//             <Image
//               source={require("../assets/animations/controller.gif")}
//               style={styles.controllerGif}
//               contentFit="contain"
//             />
//           </View>

//           {/* Right video */}
//           <View style={styles.mediaBox}>
//             <Video
//               source={require("../assets/animations/basket-ball-animation-gif-download-.mp4")}
//               style={styles.video}
//               resizeMode={ResizeMode.CONTAIN}
//               shouldPlay
//               isLooping
//               isMuted
//             />
//           </View>
//         </View>
//       </View>

//       {/* Footer */}
//       <Text style={styles.footer}>Welcome to the Sport Zone Center</Text>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "space-between",
//     paddingTop: 75,
//     paddingBottom: 25,
//     paddingHorizontal: 24,
//   },

//   content: {
//     alignItems: "center",
//   },

//   logo: {
//     width: 150,
//     height: 150,
//     marginBottom: 10,
//   },

//   title: {
//     fontSize: 36,
//     fontWeight: "900",
//     color: "white",
//     marginBottom: 8,
//   },

//   subtitle: {
//     fontSize: 15,
//     color: "rgba(255,255,255,0.9)",
//     textAlign: "center",
//     lineHeight: 22,
//     maxWidth: 320,
//     marginBottom: 18,
//   },

//   /* ✅ feature row */
//   featuresRow: {
//     flexDirection: "row",
//     gap: 14,
//     marginBottom: 18,
//   },
//   featureItem: {
//     alignItems: "center",
//   },
//   featureGif: {
//     width: 55,
//     height: 55,
//   },
//   featureText: {
//     marginTop: 4,
//     fontSize: 12,
//     color: "white",
//     fontWeight: "600",
//   },

//   buttonsContainer: {
//     width: "100%",
//     gap: 12,
//     alignItems: "center",
//     marginTop: 6,
//   },

//   loginButton: {
//     backgroundColor: "white",
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: "center",
//     width: 280,
//   },

//   loginText: {
//     color: "#0ea5e9",
//     fontSize: 16,
//     fontWeight: "800",
//   },

//   registerButton: {
//     backgroundColor: "transparent",
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: "center",
//     width: 280,
//     borderWidth: 1.6,
//     borderColor: "white",
//   },

//   registerText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "800",
//   },

//   /* ✅ NEW media row */
//   mediaRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginTop: 18,
//     width: "100%",
//   },

//   mediaBox: {
//     width: 105,
//     height: 105,
//     borderRadius: 14,
//     backgroundColor: "#0f172a",
//     overflow: "hidden",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   video: {
//     width: "100%",
//     height: "100%",
//   },

//   controllerBox: {
//     width: 120,
//     height: 120,
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   controllerGif: {
//     width: 120,
//     height: 120,
//     opacity: 0.95,
//   },

//   footer: {
//     textAlign: "center",
//     fontSize: 12,
//     color: "rgba(255,255,255,0.85)",
//   },
// });
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { API_BASE } from "./config/api";

export default function StartScreen() {
  const [hiringOpen, setHiringOpen] = useState(false);
  const [loadingHiring, setLoadingHiring] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchHiring = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings/hiring`);
        const data = await res.json();
        if (!alive) return;

        setHiringOpen(Boolean(data?.hiring_open));
      } catch (e) {
        if (!alive) return;
        setHiringOpen(false);
      } finally {
        if (!alive) return;
        setLoadingHiring(false);
      }
    };

    fetchHiring();
    const id = setInterval(fetchHiring, 15000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <LinearGradient
      colors={["#071b2f", "#0b6fa5", "#1bb6d8"]}
      style={styles.container}
    >
      {/* Top content */}
      <View style={styles.content}>
        <Image
          source={require("../assets/images/logo_snp.png")}
          style={styles.logo}
          contentFit="contain"
        />

        <Text style={styles.title}>Sport Zone</Text>
        <Text style={styles.subtitle}>
          Book stadiums, gym, gaming sessions, and reserve store items easily.
        </Text>

        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Image
              source={require("../assets/animations/basketball.gif")}
              style={styles.featureGif}
              contentFit="contain"
            />
            <Text style={styles.featureText}>Sports</Text>
          </View>

          <View style={styles.featureItem}>
            <Image
              source={require("../assets/animations/stadiem.gif")}
              style={styles.featureGif}
              contentFit="contain"
            />
            <Text style={styles.featureText}>Matches</Text>
          </View>

          <View style={styles.featureItem}>
            <Image
              source={require("../assets/animations/controller2.gif")}
              style={styles.featureGif}
              contentFit="contain"
            />
            <Text style={styles.featureText}>Gaming</Text>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push("/register")}
            activeOpacity={0.85}
          >
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mediaRow}>
          <View style={styles.mediaBox}>
            <Video
              source={require("../assets/animations/system_gamig.mp4")}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping
              isMuted
            />
          </View>

          <View style={styles.controllerBox}>
            <Image
              source={require("../assets/animations/controller.gif")}
              style={styles.controllerGif}
              contentFit="contain"
            />
          </View>

          <View style={styles.mediaBox}>
            <Video
              source={require("../assets/animations/basket-ball-animation-gif-download-.mp4")}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping
              isMuted
            />
          </View>
        </View>
      </View>

      {/* Bottom area: Hiring image + Footer */}
      <View style={styles.bottomArea}>
        {loadingHiring ? (
          <ActivityIndicator style={{ marginBottom: 8 }} />
        ) : hiringOpen ? (
          <TouchableOpacity
            onPress={() => router.push("/apply-job")}
            activeOpacity={0.85}
            style={{ marginBottom: 8 }}
          >
            <Image
              source={require("../assets/images/job_add.jpg")}
              style={styles.hiringImage}
              contentFit="contain"
            />
          </TouchableOpacity>
        ) : null}

        <Text style={styles.footer}>Welcome to the Sport Zone Center</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 75,
    paddingBottom: 25,
    paddingHorizontal: 24,
  },

  content: { alignItems: "center" },

  logo: { width: 150, height: 150, marginBottom: 10 },

  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "white",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 18,
  },

  featuresRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },
  featureItem: { alignItems: "center" },
  featureGif: { width: 55, height: 55 },
  featureText: {
    marginTop: 4,
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },

  buttonsContainer: {
    width: "100%",
    gap: 12,
    alignItems: "center",
    marginTop: 6,
  },

  loginButton: {
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    width: 280,
  },

  loginText: {
    color: "#0ea5e9",
    fontSize: 16,
    fontWeight: "800",
  },

  registerButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    width: 280,
    borderWidth: 1.6,
    borderColor: "white",
  },

  registerText: { color: "white", fontSize: 16, fontWeight: "800" },

  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    width: "100%",
  },

  mediaBox: {
    width: 105,
    height: 105,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  video: { width: "100%", height: "100%" },

  controllerBox: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },

  controllerGif: { width: 120, height: 120, opacity: 0.95 },

  bottomArea: { alignItems: "center", gap: 6 },

  hiringImage: {
    width: 220,
    height: 95,
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
});
