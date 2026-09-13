# LTReee Developer Leaderboard

## Goal
Create a public LTReee-wide leaderboard where developers opt existing Arena projects into discovery. Anyone can browse; signed-in users can cast one upvote or downvote per project, except on their own work.

## Experience
- Add a public `/leaderboard` page with LTReee’s black-space visual language, clear ranked project cards, vote totals, developer identity, tags, demo/code links, and profile links.
- Rank by all-time score: **upvotes − downvotes**. Break ties by more upvotes, then newest submission.
- Show separate upvote and downvote counts so the score is understandable.
- Let signed-in users switch their vote or remove it by pressing the active vote again, with immediate visual feedback.
- Show a sign-in prompt when a signed-out visitor tries to vote, then return them to the leaderboard after authentication.
- Disable voting controls on the owner’s own projects and explain that self-voting is not allowed.
- Add an opt-in control to each project in the existing Arena manager. Only visible projects on published profiles appear publicly.
- Add **Leaderboard** to the public top navigation and a compact top-projects preview on the homepage with a link to the full ranking.
- Include thoughtful loading, empty, error, and no-results states, plus accessible labels and mobile layouts.

## Data and security
- Add a leaderboard opt-in flag to Arena projects.
- Add a private vote table with one row per account and project, restricted by row-level rules to the voter.
- Enforce vote values, one-vote-per-account, and no self-voting in the database—not only in the interface.
- Add a public aggregate table maintained by database triggers so anonymous visitors can see counts without exposing voter identities.
- Ensure hidden, unpublished, deleted, or opted-out projects cannot appear or receive votes; clean up totals automatically when projects are removed.

## Technical implementation
- Add one approved database migration with grants, row-level policies, indexes, validation, aggregate maintenance, and trigger functions whose execution is not exposed publicly.
- Add public server functions for ranked results and a protected server function for vote mutations using the existing authentication middleware.
- Add a reusable project ranking card and query hooks so the homepage preview and full leaderboard share behavior.
- Add route-specific title, description, canonical, Open Graph, Twitter, and structured-data metadata; include `/leaderboard` in the sitemap.
- Preserve existing Arena ordering and profile pages; leaderboard rank affects only the global leaderboard.

## Verification
- Verify signed-out browsing and sign-in prompting.
- Verify upvote, downvote, vote switching, vote removal, and self-vote blocking.
- Verify opt-in/opt-out, unpublished/hidden filtering, ordering, mobile presentation, and homepage preview.
- Confirm the application builds without errors and no voter identity is publicly readable.
