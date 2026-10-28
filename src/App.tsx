import { useEffect, useState } from "react";

type Joke = {
  setup: string;
  punchline: string;
};

function App() {
  const [joke, setJoke] = useState<Joke | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);
  type Theme = "white" | "blue" | "black";
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("joke-card-theme");
    return savedTheme === "white" || savedTheme === "blue" || savedTheme === "black"
      ? savedTheme
      : "black";
  });

  useEffect(() => {
    localStorage.setItem("joke-card-theme", theme);
    document.documentElement.style.colorScheme = theme === "black" ? "dark" : "light";
  }, [theme]);

  const themeStyles = {
    white: {
      page: "bg-white text-slate-900",
      card: "border-slate-200 bg-slate-50 shadow-slate-300/60",
      joke: "bg-slate-100",
    },
    blue: {
      page: "bg-blue-600 text-white",
      card: "border-blue-400 bg-blue-950 shadow-blue-950/50",
      joke: "bg-blue-900",
    },
    black: {
      page: "bg-black text-white",
      card: "border-white/10 bg-slate-950 shadow-violet-950/40",
      joke: "bg-slate-800",
    },
  }[theme];

  useEffect(() => {
    const controller = new AbortController();

    async function fetchJoke() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "https://v2.jokeapi.dev/joke/Any?safe-mode&type=twopart",
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Could not load a joke");
        }

        const data = await response.json();

        if (data.error || !data.setup || !data.delivery) {
          throw new Error("The joke API returned an invalid joke");
        }

        setJoke({ setup: data.setup, punchline: data.delivery });
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name !== "AbortError") {
          setError(fetchError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchJoke();

    return () => controller.abort();
  }, [requestNumber]);

  return (
    <main className={`min-h-screen px-4 py-12 transition-colors duration-300 ${themeStyles.page}`}>
      <section className={`mx-auto w-full max-w-md rounded-3xl border p-7 shadow-2xl transition-colors duration-300 ${themeStyles.card}`}>
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-500">
            Joke of the moment
          </p>

          <div className="mt-4 flex items-center gap-3" aria-label="Choose card theme">
            {(["white", "blue", "black"] as Theme[]).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setTheme(color)}
                aria-label={`Use ${color} theme`}
                aria-pressed={theme === color}
                title={`${color.charAt(0).toUpperCase() + color.slice(1)} theme`}
                className={`h-9 w-9 rounded-full border-2 transition hover:scale-110 ${
                  color === "white"
                    ? "bg-white"
                    : color === "blue"
                      ? "bg-blue-600"
                      : "bg-black"
                } ${theme === color ? "border-violet-400 ring-2 ring-violet-400 ring-offset-2 ring-offset-transparent" : "border-white/70"}`}
              />
            ))}
          </div>
        </div>

        <div className={`min-h-40 rounded-2xl p-6 ${themeStyles.joke}`}>
          {isLoading && (
            <p className="flex h-full items-center justify-center opacity-70">
              Loading a joke...
            </p>
          )}

          {!isLoading && error && (
            <p className="text-center text-red-500">{error}</p>
          )}

          {!isLoading && !error && joke && (
            <div className="flex h-full flex-col justify-center text-center">
              <p className="text-xl font-semibold">{joke.setup}</p>
              <p className="mt-5 text-lg text-violet-500">{joke.punchline}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setRequestNumber((current) => current + 1)}
          disabled={isLoading}
          className="mt-6 w-full rounded-xl bg-violet-500 px-5 py-3 font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Getting a joke..." : "Tell me another joke"}
        </button>
      </section>
    </main>
  );
}

export default App;


