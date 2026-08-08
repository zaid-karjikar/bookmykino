const REPO_URL = "https://github.com/zaid-karjikar/bookmykino#data-status";

/**
 * Discloses that showtimes are generated rather than scraped.
 *
 * The upstream cinema feed moved behind bot protection, so the schedule is
 * regenerated daily by backend/seed.py. Films and posters are real; screening
 * times, prices and language versions are not.
 */
export default function DemoNotice() {
  return (
    <p className="demo-notice">
      <span className="demo-notice__tag">Demo</span>
      <span>
        Screening times are generated sample data — the cinema&rsquo;s feed is no
        longer publicly accessible. Films and posters are real.{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          Why?
        </a>
      </span>
    </p>
  );
}
