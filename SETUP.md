# CHARMLET setup

CHARMLET is a 3D hair-clip customization demo with PayPal Sandbox checkout and Gemini-assisted gemstone color styling.

## Requirements

- Node.js 20 or newer
- npm
- A PayPal Developer Sandbox REST app
- A Gemini API key to demonstrate Gemini color styling (optional; the studio's generated layouts still work without it)

## Install and configure

From the project folder, install the dependencies:

```sh
npm install
Create a local environment file from the example:
cp .env.example .env.local
Edit .env.local and enter your Sandbox credentials and Gemini key:
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
Create a Sandbox REST app in the PayPal Developer Dashboard to get the Client ID and Secret. Use a Sandbox buyer account when testing checkout. Gemini styling is optional; without a key, the studio can still generate layouts and use its built-in colors.
Run locally
Start both the CHARMLET website and its local payment API:
npm run dev
Open http://localhost:5173. Keep the terminal running while using the site. Press Control-C in that terminal to stop it.

The local app serves the website on port 5173 and the PayPal API on port 3001.
Try the demo
1. Open the DIY Studio and choose a clip size and base color.
2. Set the AI complexity and generate or refresh a gemstone layout. Gemini can refine the palette and style story when configured.
3. Drag gemstones onto the clip, confirm valid additions, and add the design to the bag.
4. Continue to checkout and complete the payment with a PayPal Sandbox buyer account. The confirmation page displays the Sandbox order and any shipping address returned by PayPal.
The project validates catalog prices on the server and confirms the PayPal Sandbox capture. It is a prototype: live payments, supplier inventory, fulfillment, and shipment tracking are not configured.
Keep credentials private
Never commit .env.local, API keys, Client Secrets, or Sandbox account passwords. .env.local is excluded by .gitignore; keep that protection in place. Use Sandbox credentials only for this demo.

The project is released under the MIT License; see LICENSE.
