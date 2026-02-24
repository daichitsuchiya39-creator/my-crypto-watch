export default function Header() {
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        Coin{" "}
        <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 bg-clip-text text-transparent">
          Strength Checker
        </span>
      </h1>
      <p className="max-w-lg text-base text-slate-400">
        Is your favorite coin truly strong? Reveal its real performance against major assets.
      </p>
    </header>
  );
}
