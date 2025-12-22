This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.plasmo.com/).

## Getting Started

### Environment Setup

Create a `.env` file in the extension directory with your Supabase credentials:

```bash
PLASMO_PUBLIC_SUPABASE_URL=your_supabase_url
PLASMO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are the same values used in the web app (with `NEXT_PUBLIC_` prefix).

### Development

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

**To load the extension:**
1. Go to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build/chrome-mv3-dev` folder
5. **Copy your extension ID** (found under the extension name, e.g., `pejdijmoenmkgeppbflobdenhhabjlaj`)

**Configure the web app:**
1. Add the extension ID to your web app's `.env.local` file:
   ```bash
   NEXT_PUBLIC_EXTENSION_ID=your_extension_id_here
   ```
2. Restart your Next.js dev server

### Authentication

The extension uses Supabase authentication. Users need to sign in through the web app first, then the extension will automatically detect their session. The extension shares the same Supabase instance as the web app, so sessions are synced via external messaging.

**How it works:**
- The web app's `SyncToExtension` component listens for Supabase auth state changes
- When a user signs in/out, it sends the session to the extension via `chrome.runtime.sendMessage`
- The extension's background script receives the message and sets the session using `supabase.auth.setSession()`
- The side panel automatically updates when the session changes

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!
