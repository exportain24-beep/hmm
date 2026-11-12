# HeyMariner ভিডিও সিস্টেম: বাংলা সেটআপ গাইড

এই রেপো শুধু HeyMariner-এর জন্য। অন্য কোনো চ্যানেল বা রেপোর সাথে এর কোনো সংযোগ নেই।

## ১. এখনই যা করা যায় (কোনো API ছাড়া)

1. GitHub-এ রেপো খুলুন -> উপরে **Actions** ট্যাব।
2. বাঁ পাশে **Video pipeline** -> ডান পাশে **Run workflow**।
3. `content_id` ঘরে লিখুন `catzoc-explained`, `dry_run` টিক দেওয়া থাকুক -> **Run workflow**।
4. শেষ হলে রান-এর পাতার নিচে **Artifacts** থেকে ভিডিও ডাউনলোড করুন।

API না থাকলে ভিডিওতে ভয়েস থাকবে না (শুধু মিউজিক), আর সেটা কোথাও পোস্ট হবে না।

## ২. API যোগ করা

**Settings -> Secrets and variables -> Actions**

**Secrets ট্যাব -> New repository secret:**

| নাম | কী দেবেন |
|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` | HeyMariner YouTube চ্যানেলের OAuth তথ্য |
| `META_ACCESS_TOKEN`, `META_PAGE_ID` | HeyMariner Facebook Page-এর টোকেন ও Page ID (Instagram একই টোকেনে চলবে) |
| `BUFFER_ACCESS_TOKEN` | যে Buffer অ্যাকাউন্টে HeyMariner-এর TikTok, LinkedIn, X যুক্ত |
| `ANTHROPIC_API_KEY` (ঐচ্ছিক) | রিয়েল-টাইম নিউজ স্ক্রিপ্ট লেখার জন্য |

**Variables ট্যাব -> New repository variable:**

| নাম | মান |
|---|---|
| `ELEVENLABS_VOICE_ID` | HeyMariner-এর জন্য বাছাই করা ভয়েসের ID |

## ৩. পরীক্ষা

1. **Actions -> Health check -> Run workflow**: প্রতিটি লাইনে `ok` দেখাতে হবে।
2. **Video pipeline** আবার `dry_run` টিক দিয়ে চালান, এবার ভয়েস সহ ভিডিও দেখুন।

## ৪. স্বয়ংক্রিয় পোস্ট চালু করা

Variables ট্যাবে তিনটি ভেরিয়েবল দিন:

| নাম | মান |
|---|---|
| `DRY_RUN` | `false` |
| `AUTO_PUBLISH` | `true` |
| `PIPELINE_ENABLED` | `true` |

এরপর প্রতিদিন `config/schedule.json`-এর সময় অনুযায়ী ভিডিও নিজে তৈরি ও পোস্ট হবে।
বন্ধ করতে চাইলে `PIPELINE_ENABLED` মুছে দিন বা `false` করুন।

## ৫. লোগো

- `public/brand/logo.png`: আসল লোগো (নেভি লেখা, টিল মারমেইড), ব্যাকগ্রাউন্ড ছাড়া; সাদা/হালকা জায়গার জন্য।
- `public/brand/logo-light.png`: একই লোগো, লেখা সাদা; ভিডিও ও থাম্বনেইলে কোনো সাদা কার্ড ছাড়া সরাসরি অ্যানিমেশনের ওপর বসে।
