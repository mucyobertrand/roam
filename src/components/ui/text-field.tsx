import { useRef, useState, type ComponentRef, type ReactNode, type Ref } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";

import { cn } from "@/lib/cn";

import { Icon, type IconName } from "./icon";
import { IconButton } from "./icon-button";
import { Text } from "./text";

type TextInputRef = ComponentRef<typeof TextInput>;

export type TextFieldProps = Omit<TextInputProps, "style" | "secureTextEntry" | "editable"> & {
  /**
   * Label stacked above the input inside the field (auth.png), which makes the field
   * taller (`h-field`). Without it the placeholder alone describes the field.
   */
  label?: string;
  /** Icon at the leading edge (user, lock, search…). */
  icon?: IconName;
  /** Element at the trailing edge, e.g. a filter IconButton on search. */
  trailing?: ReactNode;
  /** `search` is the white, outlined field used for search bars. */
  variant?: "default" | "search";
  /** Hides the text and adds a show/hide toggle. */
  secure?: boolean;
  /** Error message shown under the field; also turns the border red. */
  error?: string;
  disabled?: boolean;
  /** Layout only. */
  className?: string;
  ref?: Ref<TextInputRef>;
};

export function TextField({
  label,
  icon,
  trailing,
  variant = "default",
  secure = false,
  error,
  disabled = false,
  className,
  onFocus,
  onBlur,
  accessibilityLabel,
  placeholder,
  ref,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const inputRef = useRef<TextInputRef | null>(null);

  const setRefs = (node: TextInputRef | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const surface = variant === "search" ? "bg-surface" : focused ? "bg-lavender-soft" : "bg-surface-muted";
  const border = focused
    ? "border-lavender"
    : error
      ? "border-danger"
      : variant === "search"
        ? "border-border"
        : "border-transparent";

  const input = (
    <TextInput
      ref={setRefs}
      accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
      accessibilityHint={error}
      placeholder={placeholder}
      editable={!disabled}
      secureTextEntry={secure && hidden}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      className={cn(
        "font-jakarta-regular text-body text-ink placeholder:text-placeholder caret-lavender-strong outline-none",
        // Stacked: the input sits under the label, so drop Android's default padding.
        label ? "p-0" : "flex-1 self-stretch",
      )}
      {...props}
    />
  );

  return (
    <View className={cn("gap-xs", className)}>
      <Pressable
        // Tapping anywhere on the field focuses the input (labels and icons included).
        onPress={() => inputRef.current?.focus()}
        accessible={false}
        disabled={disabled}
        className={cn(
          // 1.5px focus ring, measured from the design.
          "flex-row items-center rounded-lg border-[1.5px]",
          label ? "h-field gap-2xl px-xl" : "h-control gap-md px-lg",
          surface,
          border,
          disabled && "opacity-40",
        )}
        style={{ borderCurve: "continuous" }}
      >
        {icon && <Icon name={icon} size="md" />}
        {label ? (
          <View className="flex-1 justify-center">
            <Text variant="caption" importantForAccessibility="no">
              {label}
            </Text>
            {input}
          </View>
        ) : (
          input
        )}
        {secure && (
          <IconButton
            icon={hidden ? "eye-off" : "eye"}
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            variant="plain"
            size="sm"
            onPress={() => setHidden((h) => !h)}
          />
        )}
        {trailing}
      </Pressable>
      {error ? (
        <Text variant="caption" tone="danger" className="px-lg" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
