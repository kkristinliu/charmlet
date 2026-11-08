# CHARMLET — Make it yours

CHARMLET is an English-language storefront with a real-time 3D hair-clip design studio. Customers can customize a clip with fixed-size gemstones, generate unlimited AI-styled layouts, validate gemstone placement, and complete a PayPal Sandbox checkout.

## What it does

- **3D DIY Studio:** Small (60 × 20 mm) and Medium (85 × 25 mm) clips, base colors, gemstone shapes, fixed SKU sizes, collision-aware placement, and live price totals.
- **AI Gem Stylist:** Every refresh creates a new mix of small, medium, and large fixed-size gemstones, packed into the remaining clip surface while respecting actual shape collision and edge limits. Draft designs target a total of $15–$100. Customers can drag dashed stones to reposition them, change each color independently, or delete individual stones before applying. Drafts do not affect the cart price until applied. Gemini can refine each design's colors and style story; the local layout generator still works without an API key.
- **PayPal Sandbox:** PayPal JavaScript SDK checkout with server-side Orders API create/capture, server-verified catalog prices, and an order confirmation page.

This is a hackathon prototype. Supplier inventory, shipping rates, fulfillment, tracking numbers, and durable server-side order storage are not connected. Orders and the latest confirmation are stored in the current browser. Sandbox checkout does not move real money.

## Requirements

- Node.js 22 or later
- pnpm 11 or later
- A PayPal Developer Sandbox REST app
- Optional Gemini API key for live AI color styling

If configured, the AI Stylist calls the Gemini API from the Node server once per refresh. API usage follows the limits and terms for the selected Gemini API key. The key is never sent to the browser. Gemstone SKUs, positions, collision checks, and prices remain controlled by the local studio.

## Run locally

1. Install dependencies:

   ```bash
   pnpm install
   ```

   `pnpm-workspace.yaml` explicitly allows the `esbuild` build script needed by Vite.

2. Create the local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Edit `.env.local` and replace the placeholders:

   ```dotenv
   PAYPAL_ENV=sandbox
   PAYPAL_CLIENT_ID=your_sandbox_client_id
   PAYPAL_CLIENT_SECRET=your_sandbox_secret
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```

   Create PayPal Sandbox credentials in the PayPal Developer Dashboard. Gemini configuration is optional; leave the key blank to use local randomized layouts and colors. Keep the PayPal Secret and Gemini key in `.env.local`; never put real credentials in source code, screenshots, chat, or GitHub. Create a separate Sandbox **Personal** account to act as the buyer. The Sandbox **Business** account is the seller.

4. Start the API and website:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:5173](http://localhost:5173).

## Try the demo

1. Open **DESIGN YOURS** and choose a clip size and base color.
2. In **AI STYLE ASSISTANT**, choose **AI DESIGN** to generate a fresh size-mixed layout fitted to the clip, with a $15–$100 estimated total. Choose **AI DESIGN** again to replace it, or **CLEAR** to remove the current AI draft.
3. Drag a dashed gemstone on the 3D clip to move it. Select its point card to choose a color, or remove an individual stone. Apply is enabled only while every gemstone fits and the total stays within the budget.
4. Add the design to the bag. The saved cart item keeps its full design while the DIY surface clears for another clip.
5. Complete the payment with a Sandbox Personal buyer account. The app captures the order through its local API and opens the order confirmation page.

## Architecture

- React + Vite storefront and React Three Fiber / Three.js 3D scene.
- Shared fixed SKU, price, color, and placement validation in `src/catalog.js`.
- Local Node API in `server/paypal-api.js`. PayPal Secrets and the Gemini API key stay server-side.
- `scripts/dev.js` loads `.env.local` and starts both the API and Vite development server.

## Hackathon development

During the PayPal AI Hackathon submission period, the project was extended with a physical-dimension 3D customization flow, validated PayPal Sandbox checkout, and a Gemini-enabled stylist that creates fresh, price-bounded gemstone layouts while keeping physical placement and pricing checks in the studio.

## Security and limitations

- `.env.local` and other `.env*` files are ignored by Git; `.env.example` contains placeholders only.
- The current local server is intended for development and judging prototypes. Before public production use, add persistent order storage, authentication/abuse controls for AI requests, fulfillment and tracking integration, and production PayPal configuration.
- AI suggestions are styling ideas. Only the existing server catalog controls SKUs, dimensions, colors, and prices. The 3D placement validator remains the authority for whether each stone can be added.

## License

MIT. See `LICENSE`.
