# Random Joke Card with React `useEffect`

This guide explains how the joke card was built, how to reuse it in any React project, and the key concepts behind it.

## What the component does

1. Displays a card with a random joke.
2. Uses `useEffect` to fetch a joke when the component loads.
3. Shows loading and error messages.
4. Uses a button to fetch another joke.
5. Cancels an unfinished request when the component changes or unmounts.

## Troubleshooting: Failed to fetch

The joke card initially used this API:

```text
https://official-joke-api.appspot.com/random_joke
```

That service began returning **429 Too Many Requests**. A `429` response means the service temporarily rejected the request because it received too many requests or rate-limited the IP address. It is not normally a problem with the React code.

The API was changed to JokeAPI:

```text
https://v2.jokeapi.dev/joke/Any?safe-mode&type=twopart
```

`twopart` means the response contains a setup and delivery, while `safe-mode` requests jokes filtered as safe.

The new response contains `delivery`, but our component uses the property name `punchline`. The response is converted to the component's type like this:

```tsx
const data = await response.json();

if (data.error || !data.setup || !data.delivery) {
  throw new Error("The joke API returned an invalid joke");
}

setJoke({ setup: data.setup, punchline: data.delivery });
```

### Useful API debugging steps

1. Check that the API URL works by opening it in the browser.
2. Check the Network tab in browser developer tools.
3. Check the response status, such as `429`, `404`, or `500`.
4. Inspect the returned JSON and compare its property names with the TypeScript code.
5. Check the browser console for `CORS`, connection, or DNS errors.
6. Try another API or a local fallback list if the public service is unavailable.

A public API can change, become unavailable, or apply rate limits. For an important production application, keeping a fallback joke list and displaying a clear error message makes the interface more reliable.

## Theme colors

The card provides white, blue, and black appearance buttons. The selected theme is stored in React state and saved in browser `localStorage`:

```tsx
type Theme = "white" | "blue" | "black";

const [theme, setTheme] = useState<Theme>(() => {
  const savedTheme = localStorage.getItem("joke-card-theme");
  return savedTheme === "white" ||
    savedTheme === "blue" ||
    savedTheme === "black"
    ? savedTheme
    : "black";
});
```

A `useEffect` saves every theme change:

```tsx
useEffect(() => {
  localStorage.setItem("joke-card-theme", theme);
}, [theme]);
```

Each colored button calls `setTheme` with its matching value:

```tsx
onClick={() => setTheme("blue")}
```

Conditional `themeStyles` objects map each theme to Tailwind classes for the page, card, and joke panel. Using this pattern lets one button change several related areas consistently.

## Main React concepts

### `useState`

`useState` stores values that can change over time:

```tsx
const [joke, setJoke] = useState<Joke | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState("");
```

- `joke` contains the current joke.
- `setJoke` updates the joke.
- `isLoading` controls the loading message.
- `error` stores any fetch error.

### `useEffect`

`useEffect` runs code after React renders the component.

```tsx
useEffect(() => {
  // Fetch data or perform another side effect.
}, [requestNumber]);
```

The second argument is the dependency array:

- `[]` runs the effect once after the initial render.
- `[requestNumber]` runs the effect whenever `requestNumber` changes.
- Variables in the array should be values used by the effect.

In this example, clicking the button increases `requestNumber`, causing `useEffect` to fetch another joke.

### Cleanup

An `AbortController` cancels the previous API request when its effect is cleaned up:

```tsx
return () => controller.abort();
```

This is useful if the component is removed from the screen or a new request starts before the old one finishes.

### Loading states

Data fetched from an API is not immediately available. Loading state prevents the UI from appearing empty:

```tsx
setIsLoading(true);
// Fetch the data
setIsLoading(false);
```

## How the request works

The component calls the Official Joke API:

```text
https://official-joke-api.appspot.com/random_joke
```

The returned JSON has this shape:

```json
{
  "type": "general",
  "setup": "Why did the bicycle fall over?",
  "punchline": "It was two tired."
}
```

A TypeScript type keeps only the fields used by the component:

```tsx
type Joke = {
  setup: string;
  punchline: string;
};
```

## Reusing the card in another React project

### 1. Copy the component

Copy the logic and JSX from `src/App.tsx` into a separate component such as:

```text
src/components/JokeCard.tsx
```

Export it and use it in your app:

```tsx
import JokeCard from "./components/JokeCard";

export default function App() {
  return <JokeCard />;
}
```

### 2. Use another API

To use a different API, replace the URL:

```tsx
const response = await fetch("YOUR_API_URL", {
  signal: controller.signal,
});
```

Then update the `Joke` type and displayed fields to match the API response.

For example, if the API returns:

```tsx
{ message: "Hello" }
```

Define and display that field instead:

```tsx
type Message = {
  message: string;
};
```

### 3. Reuse the same pattern for other data

The card follows a reusable data-fetching pattern:

1. Create state for data, loading, and errors.
2. Fetch data inside `useEffect`.
3. Trigger refetching by changing a dependency.
4. Update the loading state before and after the request.
5. Render loading, error, and success states separately.

You can adapt it for weather, products, users, articles, photos, or cryptocurrency prices.

## Tips

### Separate the fetch function from the JSX

Keep API logic in a custom hook when it grows. For example:

```text
src/hooks/useJoke.ts
```

A custom hook makes components smaller and lets other components reuse the same API logic.

### Check API responses

Always handle unsuccessful HTTP responses:

```tsx
if (!response.ok) {
  throw new Error("Could not load a joke");
}
```

### Handle `null` carefully

A nullable state is sometimes empty before data loads:

```tsx
const [joke, setJoke] = useState<Joke | null>(null);
```

Conditional rendering prevents accessing properties before a joke exists:

```tsx
{!isLoading && !error && joke && <p>{joke.setup}</p>}
```

### Do not put API calls directly in JSX

API calls belong in `useEffect`, an event handler, or a custom hook. Put functions and state updates in the effect or handler; keep JSX focused on displaying UI.

### Be careful with dependencies

The dependency array controls when an effect runs. Omitting dependencies can cause stale values, while changing an object or array on every render can cause repeated requests.

In this project, `requestNumber` is a simple dependency because a number changes only when the button is clicked.

### Avoid updating state after unmounting

Cleanup with `AbortController` is one way to stop an old request. It helps prevent React from trying to update state for a component that no longer exists.

### Do not use `useEffect` for every button action

`useEffect` is useful here because fetching should happen on initial render and whenever `requestNumber` changes. For a simpler card, the button could call a function directly and the effect could still load the first joke only:

```tsx
useEffect(() => {
  fetchJoke();
}, []);
```

## Common mistakes

### Missing dependency array

```tsx
useEffect(() => {
  fetchJoke();
});
```

Without dependencies, this effect runs after every render and may create a request loop.

### Setting state through an infinite loop

```tsx
useEffect(() => {
  setRequestNumber(requestNumber + 1);
}, [requestNumber]);
```

This effect changes the dependency and triggers itself again repeatedly. Avoid updating a dependency from its own effect unless there is a clear stopping condition.

### Fetching without a loading state

Without loading state, users cannot tell whether the application is waiting, failed, or ready.

### Ignoring errors

Always include both HTTP checks and JavaScript `try/catch` handling so API failures produce a useful UI message.

## Suggested experiments

1. Replace the button text while loading.
2. Add a joke category selector.
3. Save the current joke to local storage.
4. Add an animation when a new joke appears.
5. Move the fetch logic into a custom hook.
6. Add a retry button for failed requests.
7. Replace the API with another public API and update the TypeScript type.

## Quick summary

- `useState` stores changing UI values.
- `useEffect` runs side effects after render.
- The dependency array decides when the effect runs again.
- Cleanup functions stop or undo work from an effect.
- Loading and error states make API interfaces easier to understand.
- TypeScript types describe API response data before it is displayed.
