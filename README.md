# BC ATUS Route Visualizer

A web portal which displays the individual participant routes in the BC ATUS dataset that aids in the analysis of patterns of travel.

## Environment Setup

To run the project, you'll need to add your MapKitJS token and Google Maps API key to the `.env` file.

Participant data are stored under the file `routes.json` under `public/`

### Steps to Get API Keys:

1. **MapKitJS Token**:
   - Visit [Apple Developer](https://developer.apple.com/account).
   - Navigate to **Certificates, IDs & Profiles** > **Maps IDs**.
   - Create or select an existing Map ID and generate a MapKit JS Token.
   - Add the token to `.env`:
     ```bash
     MAPKIT_JS_TOKEN=your_mapkit_js_token_here
     ```

2. **Google Maps API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Navigate to **API & Services** > **Credentials**.
   - Create an API Key and enable **Google Maps JavaScript API**.
   - Add the API key to `.env`:
     ```bash
     GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
     ```

## Running the Project

To start the development server, run:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
# bcatus-trip-visualizer
