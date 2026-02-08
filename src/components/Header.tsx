export default function Header() {
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        推しコイン
        <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 bg-clip-text text-transparent">
          実力チェッカー
        </span>
      </h1>
      <p className="max-w-lg text-base text-slate-400">
        あなたの推しコインは本当に強い？主要銘柄と比べて実力を丸裸にします。
      </p>
    </header>
  );
}
