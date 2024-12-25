import { google } from 'googleapis';

// This function loads the OAuth2 client and sets the credentials
const loadOAuth2Client = () => {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

  if (!client_id || !client_secret || !redirect_uri) {
    throw new Error("Google credentials are missing or incomplete.");
  }

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
  );

  const access_token = process.env.GOOGLE_ACCESS_TOKEN;
  const refresh_token = process.env.GOOGLE_REFRESH_TOKEN;

  // Check if access token and refresh token are present
  if (access_token && refresh_token) {
    oAuth2Client.setCredentials({
      access_token,
      refresh_token,
    });
  } else {
    throw new Error("Google access token or refresh token is missing.");
  }

  return oAuth2Client;
};

// Function to refresh the token if necessary
const refreshAccessToken = async (oAuth2Client) => {
  try {
    const { credentials } = await oAuth2Client.refreshAccessToken();
    oAuth2Client.setCredentials(credentials);
    console.log('Access token refreshed.');
  } catch (error) {
    console.error('Error refreshing access token:', error);
  }
};

// Function to use Google Meet API (example usage)
const generateGoogleMeetLink = async () => {
  const oAuth2Client = loadOAuth2Client();

  // Check if the access token is expired
  const currentTime = Date.now();
  const tokenExpiryTime = oAuth2Client.credentials.expiry_date;

  // If the token is expired or close to expiring, refresh it
  if (currentTime > tokenExpiryTime - 5 * 60 * 1000) { // 5 minutes buffer
    console.log("Access token expired. Refreshing...");
    await refreshAccessToken(oAuth2Client);
  }

  // Now that we have a valid token, proceed with Google API calls
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  // Example: Creating a Google Meet event
  const event = {
    summary: 'Interview with Candidate',
    location: 'Online (Google Meet)',
    start: {
      dateTime: '2024-12-25T10:00:00Z',
      timeZone: 'UTC',
    },
    end: {
      dateTime: '2024-12-25T11:00:00Z',
      timeZone: 'UTC',
    },
    conferenceData: {
      createRequest: {
        requestId: 'sample123',
        conferenceSolutionKey: { type: 'hangoutsMeet' },
        status: { statusCode: 'success' },
      },
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });
    console.log('Event created:', response.data);
    return response.data.hangoutLink; // The Google Meet link
  } catch (error) {
    console.error('Error creating event:', error);
  }
};

export { generateGoogleMeetLink };
