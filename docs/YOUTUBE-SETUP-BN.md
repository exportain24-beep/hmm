# YouTube API সেটআপ (HeyMariner)

লক্ষ্য: তিনটি মান বের করা: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`।
এই টোকেন দিয়ে আপলোড, টাইটেল/ডেসক্রিপশন/ট্যাগ (SEO), থাম্বনেইল, প্লেলিস্ট, কমেন্ট ও অ্যানালিটিক্স সব করা যাবে।

## ১. Google Cloud প্রজেক্ট
1. https://console.cloud.google.com খুলুন (যে Google অ্যাকাউন্ট HeyMariner চ্যানেলের মালিক বা ম্যানেজার, সেটি দিয়ে)।
2. উপরে প্রজেক্ট মেনু -> **New Project** -> নাম `HeyMariner` -> Create -> প্রজেক্টটি সিলেক্ট করুন।

## ২. API চালু করা
**APIs & Services -> Library**-তে গিয়ে এই দুটি খুঁজে **Enable** করুন:
- YouTube Data API v3
- YouTube Analytics API

## ৩. OAuth consent (Google Auth Platform)
1. **APIs & Services -> OAuth consent screen** (নতুন নাম: Google Auth Platform) -> Get started।
2. App name `HeyMariner`, support email আপনার ইমেইল, Audience **External**, contact email, Finish।
3. **Audience** পাতায় **Publish app** চাপুন, যাতে স্ট্যাটাস **In production** হয়।
   Testing অবস্থায় রাখলে refresh token ৭ দিন পর বন্ধ হয়ে যায়।

## ৪. OAuth Client
1. **Clients** (বা Credentials) -> **Create client** -> Application type **Web application**।
2. **Authorized redirect URIs**-তে যোগ করুন: `https://developers.google.com/oauthplayground`
3. Create -> **Client ID** ও **Client secret** কপি করে রাখুন।

## ৫. Refresh token
1. https://developers.google.com/oauthplayground খুলুন।
2. ডান পাশে গিয়ার আইকন -> **Use your own OAuth credentials** টিক দিন -> Client ID ও secret বসান।
3. বাঁ পাশে "Input your own scopes" ঘরে এই লাইনটি পেস্ট করুন:

```
https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/yt-analytics.readonly
```

4. **Authorize APIs** -> HeyMariner চ্যানেলের অ্যাকাউন্ট (Brand account হলে চ্যানেলটি) বাছুন -> "Google hasn't verified this app" এলে Advanced -> Go to HeyMariner -> সব পারমিশন Allow।
5. **Exchange authorization code for tokens** -> **Refresh token** কপি করুন।

## ৬. GitHub-এ বসানো
রেপো -> Settings -> Secrets and variables -> Actions -> New repository secret:
`YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`

তারপর Actions -> **Health check** চালান; `publisher: youtube` লাইনে চ্যানেলের নাম দেখালে ঠিক আছে।

## জানা দরকার
- নতুন Google Cloud প্রজেক্ট YouTube-এর API audit পাস না করা পর্যন্ত API দিয়ে আপলোড করা ভিডিও private-এ আটকে থাকতে পারে। আপনার অন্য চ্যানেলের যে প্রজেক্ট দিয়ে ইতিমধ্যে public আপলোড হচ্ছে, সেটির Client ID/secret ব্যবহার করে শুধু ধাপ ৫ HeyMariner চ্যানেলের জন্য করলে এই সমস্যা এড়ানো যায়।
- দৈনিক কোটা ১০,০০০ ইউনিট; একটি আপলোডে প্রায় ১,৬০০ ইউনিট লাগে।
- পাসওয়ার্ড বদলালে বা অ্যাক্সেস revoke করলে ধাপ ৫ আবার করতে হবে।
