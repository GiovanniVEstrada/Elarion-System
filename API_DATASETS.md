# Elarion API Datasets

This document tracks the client payloads that should be sent to the API. The goal is to keep frontend forms, backend validation, and Mongo models aligned.

## Mood Entries

Endpoint: `POST /api/moods`

```js
{
  mood: "great" | "good" | "neutral" | "bad" | "awful",
  note: string,
  date: Date | null
}
```

Used by the tide chart as the primary weekly mood signal.

## Journal Entries

Endpoint: `POST /api/journal`

```js
{
  title: string,
  content: string,
  mood: "great" | "good" | "neutral" | "bad" | "awful",
  tags: string[],
  clarity: 1 | 2 | 3 | 4 | 5 | null,
  mentalState: string | null,
  folder: string | null,
  sentimentScore: 1 | 2 | 3 | 4 | 5 | null
}
```

Used by the Reflect Log timeline and future Insights correlations.

## Tasks / Actions

Endpoint: `POST /api/tasks`

```js
{
  title: string,
  intent: string,
  energyLevel: "low" | "medium" | "high" | null,
  priority: "low" | "medium" | "high",
  category: string,
  completed: boolean,
  alignmentScore: 1 | 2 | 3 | null,
  postMood: "great" | "good" | "neutral" | "bad" | "awful" | null,
  dueDate: Date | null
}
```

`intent`, `alignmentScore`, and `postMood` are important for Insights. These should not be treated as decorative fields.

## Habits

Endpoint: `POST /api/habits`

```js
{
  name: string,
  frequency: "daily" | "weekly",
  description: string
}
```

Completion data is written through `POST /api/habits/:id/complete`, which appends today's date and recalculates the cached streak.

## Calendar Events

Endpoint: `POST /api/calendar`

```js
{
  title: string,
  date: "YYYY-MM-DD",
  time: "HH:mm" | "",
  expectedFeeling: "energizing" | "neutral" | "necessary" | "draining" | null,
  actualFeeling: "energizing" | "neutral" | "necessary" | "draining" | null,
  clientId: string | null
}
```

`clientId` is only needed for old localStorage migration idempotency.

## Reflections

Endpoint: `POST /api/reflections`

```js
{
  date: "YYYY-MM-DD",
  predictedMood: "great" | "good" | "neutral" | "bad" | "awful" | null,
  actualMood: "great" | "good" | "neutral" | "bad" | "awful" | null,
  alignmentAverage: 1 | 2 | 3 | null,
  notes: string
}
```

Reflections are day-level summaries. Mood entries remain the cleaner source for the week chart.
