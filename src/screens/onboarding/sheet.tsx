import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/lib/cn";

import { SheetEdge } from "./sheet-edge";

/**
 * The white sheet: the curved edge on top (`h-sheet-cap`, stretched to the screen
 * width) over a plain white body starting where the curve meets the right side.
 */
export function Sheet({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cn("relative", className)}>
      <View className="absolute inset-x-0 top-0 h-sheet-cap">
        <SheetEdge />
      </View>
      <View className="absolute inset-x-0 top-sheet-edge -bottom-4xl bg-surface" />
      {children}
    </View>
  );
}
