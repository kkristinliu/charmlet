# CHARMLET

CHARMLET is a customizable hair-clip storefront with a real-time 3D DIY studio. Customers can choose a clip size and base color, arrange catalog gemstones, and see the price update as they design.

## Built with

- React, Vite, Three.js, and React Three Fiber for the storefront and 3D studio
- Gemini API for optional gemstone color palette and style-story refinement
- PayPal JavaScript SDK and Orders API in Sandbox mode for test checkout
- Geometry-based studio rules for gemstone placement, fit, and price validation

The gemstone layout is generated and validated by the studio. Gemini refines colors and style text; it does not choose placement coordinates. If Gemini is unavailable, the studio-generated palette remains available.

## Run locally

1. Install Node.js and pnpm.
2. Install dependencies with `pnpm install`.
3. Copy `.env.example` to `.env.local` and add PayPal Sandbox credentials. Add a Gemini API key if you want Gemini palette refinement.
4. Start the app with `pnpm dev` and open the local URL shown in the terminal.

Keep `.env.local` private. Do not commit API keys or PayPal secrets.

See [SETUP.md](SETUP.md) for detailed setup and troubleshooting instructions.

## Deploy

The included `render.yaml` configures a Render Node web service. Connect this repository in Render and provide `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `GEMINI_API_KEY` as private environment variables in the Render dashboard. The PayPal environment is set to Sandbox by default.
