
# MATH RUSH - Vercel Serverless + Ably
Only Vercel + React + Node (api/ably-token.js)

1. npm i ably
2. Get ABLY_API_KEY from ably.com
3. Vercel env: ABLY_API_KEY
4. vercel deploy

Flow: Room code = seed -> same 25 Qs locally. Ably channels handle join/answer.
Presence API tracks players in room.
