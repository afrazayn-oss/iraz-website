# Eras Consultancy app

iOS and Android app for Eras Consultancy clients and staff, built with React Native (Expo SDK 58) and Supabase.

**Clients can**
- book a consultation: choose a service, day, time (UK time) and video, phone or in person
- see and cancel their bookings
- follow their cases, with a status timeline and notes from the team
- upload documents securely and open documents the team shares with them
- send enquiries and read the replies
- edit their details, and delete their account (an App Store requirement)

**Staff (admin accounts) can**
- confirm, cancel and complete bookings
- open cases for clients and post status updates
- share documents with a client or a specific case
- reply to and close enquiries
- search clients and see each client's cases, bookings and documents

> **Placeholder content.** The company text, services, contact details, colours and icon are placeholders.
> Replace everything marked `TODO` in `src/config/company.ts` and `src/theme.ts`, plus the images in
> `assets/images/`, before submitting to the App Store.

## Project layout

```
src/app/                 Screens (Expo Router: each file is a route)
  sign-in, sign-up, forgot-password, account
  (client)/(tabs)/       Client tabs: Home, Bookings, My cases, Documents, Enquiries
  (client)/              Client screens: book, new-enquiry, case/[id]
  admin/(tabs)/          Staff tabs: Bookings, Cases, Enquiries, Clients
  admin/                 Staff screens: client/[id], case/[id], new-case, enquiry/[id]
src/config/company.ts    Company details, services, booking hours  <- edit this
src/theme.ts             Brand colours                              <- and this
src/components/          Shared UI
src/lib/                 Supabase client, documents, time zone and label helpers
supabase/schema.sql      Database tables, security rules and storage bucket
```

## 1. Set up the backend (Supabase, about 10 minutes)

1. Create a free project at [supabase.com](https://supabase.com). Choose the **London (eu-west-2)** region so client data stays in the UK.
2. In the dashboard, open **SQL Editor**, paste in all of `supabase/schema.sql` and click **Run**.
3. Under **Project Settings -> API**, copy the **Project URL** and the **anon public** key.
4. Copy `.env.example` to `.env.local` and paste both values in.
5. Under **Authentication -> URL Configuration**, set **Site URL** to your website. Confirmation and password-reset emails link there.
6. Optional: under **Authentication -> Email Templates**, add your branding to the emails.

### Make a staff account

Sign up in the app as normal, then run this in the SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@yourcompany.co.uk';
```

Sign out and back in. You'll now see the staff tabs.

## 2. Run the app on your phone

```bash
npm install
npx expo start
```

Install **Expo Go** from the App Store or Play Store and scan the QR code. Every library this app uses works in Expo Go, so you don't need a Mac or Xcode to try it.

Checks to run before committing:

```bash
npm run typecheck
npm run lint
```

## 3. Publish to the App Store and Google Play

Builds run in the cloud with [EAS](https://expo.dev/eas), so you don't need a Mac.

1. You need an **Apple Developer Program** membership (£79/year). For Google Play, you need a **Play Console** account (one-off $25).
2. In `app.json`, set `ios.bundleIdentifier` and `android.package` to the IDs you want. They can't be changed after the first release.
3. Build and submit:
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init
   npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://xxx.supabase.co --environment production --visibility plaintext
   npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon key> --environment production --visibility plaintext
   npx eas-cli@latest build --platform ios --profile production
   npx eas-cli@latest submit --platform ios
   ```
   Use `--platform android` for Google Play.
4. In App Store Connect, complete the listing: screenshots, description, **privacy policy URL**, and the
   **App Privacy** questionnaire. The app collects name, email, phone number and user-uploaded documents, all linked to the user and used for app functionality.
5. Give Apple's reviewers a working **demo client account** in the review notes. They will sign in to test it.

### App Store checklist

- [ ] Real company details, services, colours and icon (`src/config/company.ts`, `src/theme.ts`, `assets/images/`)
- [ ] A privacy policy page at the URL in `Company.privacyPolicyUrl`
- [ ] Supabase project created, schema run, staff account made
- [ ] Demo client account for App Review
- [ ] In-app account deletion: included (Account -> Delete my account)

## Notes

- **Booking times** are in UK time (`Europe/London`) whatever the phone's time zone. Opening hours, slot length,
  minimum notice and how far ahead clients can book are set in `Availability` in `src/config/company.ts`.
  The database stops two clients from booking the same slot.
- **Security.** Row-level security in `schema.sql` means clients can only ever read their own bookings, cases,
  documents and enquiries, and can't promote themselves to staff. Documents sit in a private storage bucket
  and are opened with links that expire after 5 minutes.
- **Not included yet** (good next steps): push or email notifications when a booking is confirmed or a case
  changes, calendar invites, online payments, and in-app chat.
