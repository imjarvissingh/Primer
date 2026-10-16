# Primer — Safety Gates

US child-directed services require COPPA-specific legal review, appropriate parental consent before applicable data collection, parental controls, minimum necessary data, deletion and retention measures, security and vendor review.

## Release blockers
Verified parent authority and consent; cross-account authorization; minimal child identifiers; data deletion process; no unnecessary third-party trackers; reviewed curriculum and correct answer keys; accessible tap controls; non-shaming feedback; no manipulative game loops; no unrestricted chat or microphones; incident response and no unresolved high-severity vulnerabilities.

Adult-operated fictional-data demos can precede live-child readiness. Do not represent synthetic data as actual learner outcomes.

## Block Builder demo (Phase 3)
The mission is a draft, adult-operated demonstration: no accounts, no stored or logged learner data, no analytics, and feedback is neutral with no streaks, points or time pressure. Its hints and wording are unreviewed. The API is unauthenticated and in-memory and is **not** secure assessment infrastructure; see ARCHITECTURE.md. Guided practice is never reported as mastery.

## Independent check and demo summary (Phase 5)
Adult-operated, synthetic-data demonstration only. No accounts, names, emails, dates of birth, analytics or stored records; answers are not logged; sessions are in memory and expire. The check shows no timers, streaks, scores or per-answer correctness to the learner. The summary page is **unauthenticated** (anyone holding a session id can open it), is labelled synthetic, and states that mastery is not awarded. It must not be shown as a real child's result, a diagnosis or evidence of effectiveness. Real use needs verified parent authority, consent, authorization and deletion first (see release blockers above).

## Demo hardening limits (Phase 6)
The demo has no parental authorization. The summary URL's session id works as an unguessable access capability: anyone with the link can view that synthetic summary until the session expires (30 minutes idle or server restart). The page is marked no-index, no-referrer and no-store, and the id is not put in navigation links, analytics (none exist), logs or fixtures. The start rate limit is per process and identifier-free; it is not abuse protection for a hosted product. None of this is COPPA compliance, a security review or child-safety readiness. Do not enter real child information.
