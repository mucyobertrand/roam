import { Stack } from "expo-router";
import { useState, type ReactNode } from "react";
import { ScrollView, Switch, View } from "react-native";

import { Wordmark } from "@/components/wordmark";
import { colors } from "@/theme/tokens";
import {
  Alert,
  Badge,
  Button,
  Chip,
  CodeInput,
  Divider,
  Icon,
  IconButton,
  PressableScale,
  SegmentedControl,
  Stepper,
  Text,
  TextField,
  type IconName,
} from "@/components/ui";

/**
 * Dev showcase of every token and shared primitive, for comparing against
 * assets/prompt-imgs/design.png. Not linked from production navigation.
 */

const palette = [
  { name: "Primary Yellow", className: "bg-primary", use: "Primary actions, active states" },
  { name: "Lavender", className: "bg-lavender", use: "Secondary actions, highlights" },
  { name: "Text Primary", className: "bg-ink", use: "Headings, primary text" },
  { name: "Text Secondary", className: "bg-ink-muted", use: "Body text, secondary text" },
  { name: "Surface White", className: "bg-surface border border-border", use: "Cards, sheets, modals" },
  { name: "Surface Gray", className: "bg-surface-muted", use: "App background, input fields" },
  { name: "Border Gray", className: "bg-border", use: "Dividers, borders" },
  { name: "Glass", className: "bg-glass border border-border", use: "Tab bar, glass surfaces" },
] as const;

const iconography: IconName[] = ["home", "search", "heart", "calendar", "user", "settings", "map-pin", "sliders", "bell", "help"];

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <View className="gap-lg rounded-xl bg-surface p-xl shadow-card" style={{ borderCurve: "continuous" }}>
      <Text variant="title">
        {index}. {title}
      </Text>
      {children}
    </View>
  );
}

export default function DesignSystemScreen() {
  const [name, setName] = useState("Joanna Smith");
  const [filter, setFilter] = useState("Cabins");
  const [category, setCategory] = useState("All Stays");
  const [view, setView] = useState<"list" | "map">("list");
  const [instantBook, setInstantBook] = useState(true);
  const [guests, setGuests] = useState(1);
  const [alerts, setAlerts] = useState({ success: true, error: true });
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("42");

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Design system" }} />
      <ScrollView className="flex-1 bg-surface-muted" contentContainerClassName="gap-lg p-xl pb-4xl">
        <Section index="01" title="Brand">
          <View className="gap-lg">
            <Wordmark size="lg" />
            <Text variant="tagline">Find unforgettable stays{"\n"}for every kind of trip.</Text>
          </View>
        </Section>

        <Section index="02" title="Color palette">
          <View className="flex-row flex-wrap gap-md">
            {palette.map((c) => (
              <View key={c.name} className="w-[47%] gap-xs">
                <View className={`h-4xl rounded-md ${c.className}`} style={{ borderCurve: "continuous" }} />
                <Text variant="caption">{c.name}</Text>
                <Text variant="label" tone="muted">
                  {c.use}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section index="03" title="Typography">
          <Text variant="display">Find your next stay</Text>
          <Text variant="heading">Modern Cabin with Hot Tub</Text>
          <Text variant="hero-xs">Modern Cabin with Hot Tub</Text>
          <Text variant="price-lg">$289</Text>
          <Text variant="stat">4.9</Text>
          <Text variant="body">
            From mountain cabins to oceanfront villas, roam helps you find unforgettable stays for every kind of
            trip.
          </Text>
          <Text variant="caption">Lake Arrowhead, CA</Text>
          <Button title="Book this stay" size="sm" className="self-start" />
        </Section>

        <Section index="04" title="Buttons">
          <Button
            title="Book this stay"
            trailingIcon="arrow-right"
            loading={loading}
            onPress={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1500);
            }}
          />
          {/* The auth screen passes the Google logo asset as `leading`. */}
          <Button title="Continue with Google" variant="secondary" />
          <Button title="Disabled" disabled />
          <View className="flex-row gap-lg">
            <IconButton icon="heart" accessibilityLabel="Save" />
            <IconButton icon="share" accessibilityLabel="Share" />
            <IconButton icon="search" accessibilityLabel="Search" />
            <IconButton icon="bookmark" accessibilityLabel="Bookmark" />
          </View>
        </Section>

        <Section index="05" title="Input fields">
          <TextField
            variant="search"
            icon="search"
            placeholder="Search stays"
            defaultValue="Cabins in California"
            trailing={<IconButton icon="sliders" accessibilityLabel="Filters" variant="plain" size="sm" />}
          />
          <TextField icon="user" placeholder="Enter your name" />
          <TextField icon="user" placeholder="Full name" value={name} onChangeText={setName} />
          <TextField icon="lock" placeholder="Password" secure defaultValue="secretpass" />
          <TextField icon="user" placeholder="Email" error="Enter a valid email address." />
          <TextField label="Full name" icon="user" placeholder="e.g. Adrian Hajdin" />
          <Divider label="or" />
          <CodeInput value={code} onChangeText={setCode} />
        </Section>

        <Section index="06" title="Filter chips">
          <View className="flex-row flex-wrap gap-sm">
            {["Cabins", "Under $300", "Pet Friendly", "Quiet"].map((label) => (
              <Chip key={label} label={label} selected={filter === label} onPress={() => setFilter(label)} />
            ))}
          </View>
          <View className="flex-row flex-wrap gap-sm">
            {(
              [
                ["All Stays", "home"],
                ["Cabins", "cabin"],
                ["Beach", "beach"],
                ["City", "city"],
                ["Villas", "villa"],
              ] as const
            ).map(([label, icon]) => (
              <Chip
                key={label}
                label={label}
                icon={icon}
                size="sm"
                selected={category === label}
                onPress={() => setCategory(label)}
              />
            ))}
          </View>
          <Text variant="caption" tone="muted">
            lg (home categories): press scale + background cross-fade
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {(
              [
                ["All Stays", "home-fill"],
                ["Cabins", "cabin"],
                ["Beach", "waves"],
                ["City", "city"],
                ["Villas", "villa"],
              ] as const
            ).map(([label, icon]) => (
              <Chip
                key={label}
                label={label}
                icon={icon}
                size="lg"
                selected={category === label}
                onPress={() => setCategory(label)}
              />
            ))}
          </View>
        </Section>

        <Section index="06b" title="Search filter chips">
          <View className="flex-row flex-wrap gap-sm">
            {["Cabins", "Under $300", "Pet Friendly", "Quiet"].map((label) => (
              <Chip key={label} label={label} size="filter" selected={filter === label} onPress={() => setFilter(label)} />
            ))}
          </View>
        </Section>

        <Section index="07" title="Press feedback">
          <PressableScale className="items-center rounded-xl bg-surface-muted p-2xl" accessibilityRole="button">
            <Text variant="title">PressableScale</Text>
            <Text variant="caption" tone="muted">
              0.97 scale, 120 ms ease-out; off with reduced motion
            </Text>
          </PressableScale>
        </Section>

        <Section index="11" title="Iconography">
          <View className="flex-row flex-wrap gap-md">
            {iconography.map((icon) => (
              <View key={icon} className="size-icon-button items-center justify-center rounded-full border border-border">
                <Icon name={icon} />
              </View>
            ))}
          </View>
        </Section>

        <Section index="12" title="Segmented control">
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: "List", icon: "list" },
              { value: "map", label: "Map", icon: "map" },
            ]}
          />
        </Section>

        <Section index="13" title="Toggles / Steppers">
          <View className="flex-row items-center gap-2xl">
            {/* Native Switch, unwrapped; tinted with the mirrored primary token. */}
            <Switch
              accessibilityLabel="Instant book"
              value={instantBook}
              onValueChange={setInstantBook}
              trackColor={{ true: colors.primary }}
              thumbColor={colors.surface}
            />
            <Stepper value={guests} onChange={setGuests} min={1} max={16} accessibilityLabel="Guests" />
          </View>
        </Section>

        <Section index="14" title="Status / Alerts">
          {alerts.success && (
            <Alert
              tone="success"
              message="Account created successfully"
              onDismiss={() => setAlerts((a) => ({ ...a, success: false }))}
            />
          )}
          {alerts.error && (
            <Alert
              tone="error"
              message="Something went wrong. Please try again."
              onDismiss={() => setAlerts((a) => ({ ...a, error: false }))}
            />
          )}
        </Section>

        <Section index="15" title="Tags / Badges">
          <View className="flex-row flex-wrap gap-sm">
            <Badge label="Guest favorite" tone="favorite" icon="star" />
            <Badge label="New" tone="success" />
            <Badge label="20% off" tone="discount" />
            <Badge label="Superhost" tone="info" />
          </View>
          <View className="flex-row flex-wrap gap-sm">
            <Badge label="Hot Tub" icon="hot-tub" size="sm" />
            <Badge label="Pet Friendly" icon="paw" size="sm" />
          </View>
          <View className="flex-row flex-wrap gap-sm">
            <Badge label="Hot Tub" icon="hot-tub" size="pill" />
            <Badge label="Pet Friendly" icon="paw" size="pill" />
            <Badge label="Pool" icon="pool" size="pill" />
          </View>
        </Section>
      </ScrollView>
    </>
  );
}
