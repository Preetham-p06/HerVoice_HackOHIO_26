"""One scheduled scan. Run with python -m scripts.scan_feed; no credentials in cron."""
import os
from dotenv import load_dotenv

if __name__ == "__main__":
    load_dotenv()
    os.environ["MONITOR_SCHEDULER"] = "external"
    from services.api.main import poll_live_feed, memory
    try:
        memory.purge_expired()
        count = poll_live_feed()
    except Exception:
        raise SystemExit("Scan failed. Check connector, organization keys, and MongoDB availability.") from None
    print(f"Processed {count} queued image(s).")
