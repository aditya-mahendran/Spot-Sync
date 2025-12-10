```markdown
# Spot Sync

Spot Sync is a small app that connects to Spotify and gives a simple view of your listening habits using your Spotify data.

## Features

- Connects to your Spotify account
- Pulls data such as top tracks, artists, and recent listening
- Uses audio features like energy and valence from the Spotify API
- Shows a clean, easy-to-read summary of your listening

## Why I built it

I wanted to work with the Spotify Web API, handle an OAuth flow, and turn raw music data into something that feels more like a “persona” for how someone listens.

## Getting started

1. Clone the repo:

```bash
git clone https://github.com/Aditya-Mahendran/Spot-Sync.git
cd Spot-Sync

2. Install dependencies:

bash
Copy code
npm install

3. Create a local environment file (for example .env or .env.local) with your own Spotify app credentials. The app expects values such as:

bash
Copy code
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

4. Run the app:

bash
Copy code
npm run dev
