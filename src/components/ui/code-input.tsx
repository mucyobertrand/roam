import { useRef, useState, type ComponentRef, type Ref } from "react";
import { Platform, Pressable, TextInput, View } from "react-native";

import { cn } from "@/lib/cn";

import { Text } from "./text";

type TextInputRef = ComponentRef<typeof TextInput>;

export type CodeInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  /** Called once all digits are entered (e.g. to auto-submit). */
  onComplete?: (code: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Layout only. */
  className?: string;
  ref?: Ref<TextInputRef>;
};

/**
 * One-time code entry: a row of digit boxes drawn over a single hidden TextInput, so
 * typing, deleting, pasting and SMS/email autofill all behave like one field.
 */
export function CodeInput({
  value,
  onChangeText,
  onComplete,
  length = 6,
  error = false,
  disabled = false,
  autoFocus = false,
  className,
  ref,
}: CodeInputProps) {
  const inputRef = useRef<TextInputRef | null>(null);
  const [focused, setFocused] = useState(autoFocus);

  const setRefs = (node: TextInputRef | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, length);
    onChangeText(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  // The box that receives the next digit (the last one once full).
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      accessible={false}
      disabled={disabled}
      className={cn("relative", disabled && "opacity-40", className)}
    >
      <View className="flex-row gap-sm" importantForAccessibility="no-hide-descendants">
        {Array.from({ length }, (_, i) => {
          const active = focused && i === activeIndex;
          return (
            <View
              key={i}
              className={cn(
                "h-control flex-1 items-center justify-center rounded-lg border-[1.5px]",
                active ? "bg-lavender-soft border-lavender" : "bg-surface-muted",
                !active && (error ? "border-danger" : "border-transparent"),
              )}
              style={{ borderCurve: "continuous" }}
            >
              <Text variant="title">{value[i] ?? ""}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={setRefs}
        value={value}
        onChangeText={handleChange}
        maxLength={length}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={`Verification code, ${value.length} of ${length} digits entered`}
        caretHidden
        // Invisible but focusable, stretched over the boxes so taps and paste land on it.
        className="absolute inset-0 text-transparent opacity-0"
      />
    </Pressable>
  );
}
