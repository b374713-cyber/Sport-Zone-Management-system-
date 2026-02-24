// import React from "react";
// import { Tabs } from "expo-router";
// import { Platform } from "react-native";

// import { HapticTab } from "@/components/haptic-tab";
// import { IconSymbol } from "@/components/ui/icon-symbol";
// import { Colors } from "@/constants/theme";
// import { useColorScheme } from "@/hooks/use-color-scheme";

// export default function TabLayout() {
//   const colorScheme = useColorScheme();

//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarButton: HapticTab,
//         tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,

//         // ✅ IMPORTANT: do NOT use tabBarBackground here (it can block touches on Android)
//         tabBarStyle: {
//           backgroundColor: "#fff",
//           borderTopWidth: 1,
//           borderTopColor: "#e5e5e5",
//           height: Platform.OS === "ios" ? 86 : 64,
//           paddingBottom: Platform.OS === "ios" ? 22 : 10,
//           paddingTop: 8,
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="sports"
//         options={{
//           title: "Sports",
//           tabBarIcon: ({ color }) => (
//             <IconSymbol size={28} name="sportscourt.fill" color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="gym"
//         options={{
//           title: "Gym",
//           tabBarIcon: ({ color }) => (
//             <IconSymbol
//               size={28}
//               name="figure.strengthtraining.traditional"
//               color={color}
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="gaming"
//         options={{
//           title: "Gaming",
//           tabBarIcon: ({ color }) => (
//             <IconSymbol size={28} name="gamecontroller.fill" color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="store"
//         options={{
//           title: "Store",
//           tabBarIcon: ({ color }) => (
//             <IconSymbol size={28} name="tshirt.fill" color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="bookings"
//         options={{
//           title: "My Bookings",
//           tabBarIcon: ({ color }) => (
//             <IconSymbol size={28} name="calendar.badge.clock" color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: "Profile",
//           tabBarIcon: ({ color }) => (
//             <IconSymbol size={28} name="person.fill" color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="livechat"
//         options={{
//           title: "Live Chat",
//           tabBarIcon: ({ color }) => (
//             <IconSymbol size={28} name="message.fill" color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }
import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e5e5",
          height: Platform.OS === "ios" ? 86 : 64,
          paddingBottom: Platform.OS === "ios" ? 22 : 10,
          paddingTop: 8,
        },
      }}
    >
      {/* ✅ Gym FIRST */}
      <Tabs.Screen
        name="gym"
        options={{
          title: "Gym",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="figure.strengthtraining.traditional"
              color={color}
            />
          ),
        }}
      />

      {/* ✅ Sports SECOND */}
      <Tabs.Screen
        name="sports"
        options={{
          title: "Sports",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="sportscourt.fill" color={color} />
          ),
        }}
      />

      {/* ✅ Keep Gaming same position */}
      <Tabs.Screen
        name="gaming"
        options={{
          title: "Gaming",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gamecontroller.fill" color={color} />
          ),
        }}
      />

      {/* ✅ Keep Store same position */}
      <Tabs.Screen
        name="store"
        options={{
          title: "Store",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="tshirt.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: "My Bookings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar.badge.clock" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="livechat"
        options={{
          title: "Live Chat",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="message.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
