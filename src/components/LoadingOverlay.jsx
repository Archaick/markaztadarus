// The page loading screen, shown while a page's texts load. Its styles live in
// index.html, where the same screen is drawn before any script has run, so
// the first paint and this fallback look identical.
export default function LoadingOverlay() {
  return (
    <div className="mt-splash" role="status" aria-label="Loading">
      <div className="mt-splash__mark">
        <img src="/MTIFavicon.png" alt="" width={54} height={54} />
      </div>
      <p className="mt-splash__name">MARKAZ TADARUS INDONESIA</p>
      <div className="mt-splash__bar" />
    </div>
  );
}
