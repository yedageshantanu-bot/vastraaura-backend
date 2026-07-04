# VastraAura Backend — Cloudflare Deployment Guide

Since the backend uses **Mongoose (MongoDB connection)**, it is not directly compatible with Cloudflare Workers due to persistent connection requirements. This guide explains how to expose and run your Express backend securely via **Cloudflare Tunnel (`cloudflared`)** or traditional cloud hosting, and connect it to your Cloudflare-hosted Next.js frontend.

---

## Part 1: Exposing Local Backend using Cloudflare Tunnel

A Cloudflare Tunnel connects your local port (e.g., `5001`) securely to a public domain or subdomain on Cloudflare without opening router ports.

### Step 1: Install Cloudflare CLI (`cloudflared`)
- Download and install the CLI tool: [Cloudflare Tunnels Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
- Or install via package managers:
  - **macOS (Homebrew):** `brew install cloudflared`
  - **Windows (winget):** `winget install Cloudflare.cloudflared`

### Step 2: Log in to Cloudflare
In your terminal, authenticate the CLI with your Cloudflare account:
```bash
cloudflared tunnel login
```

### Step 3: Create a Tunnel
Create a new tunnel named `vastraaura-backend`:
```bash
cloudflared tunnel create vastraaura-backend
```
*Note: This command will generate a UUID and a credential JSON file on your machine.*

### Step 4: Route Tunnel to a Subdomain
Route your tunnel traffic to a subdomain (e.g., `api.yourdomain.com`):
```bash
cloudflared tunnel route dns vastraaura-backend api.yourdomain.com
```

### Step 5: Configure and Run the Tunnel
Create a configuration file `config.yml` in your local `.cloudflared` directory (or current directory):
```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /Users/username/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:5001
  - service: http_status:404
```

Start the tunnel:
```bash
cloudflared tunnel run vastraaura-backend
```
*The local backend is now securely accessible from anywhere in the world at `https://api.yourdomain.com`!*

---

## Part 2: Connecting the Frontend Env Variables

Now that your backend is publicly exposed (via the Cloudflare Tunnel URL or a deployment service like Render/Railway), you must reset the frontend environment variables to point to it.

### Step 1: Update wrangler.jsonc (for Local CLI Deploys)
In `client/wrangler.jsonc`, update the `vars` block:
```json
  "vars": {
    "NEXT_PUBLIC_API_URL": "https://api.yourdomain.com/api",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID": "rzp_live_SvX6cUiT0uMyax"
  }
```

### Step 2: Update on Cloudflare Pages Dashboard
If you deploy via Cloudflare Pages integration:
1. Go to your **Cloudflare Dashboard** -> **Workers & Pages**.
2. Select your `vastraaura-client` project.
3. Navigate to **Settings** -> **Variables**.
4. Under **Environment Variables**, click **Edit variables** and set:
   - `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com/api`
5. Re-deploy the site for the changes to take effect.
