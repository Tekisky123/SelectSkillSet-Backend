export const candidateTemplate = (
  candidateName,
  date,
  time,
  meetLink,
  interviewRequestId,
  interviewerId,
  url
) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Scheduled</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f4f7f9;
        margin: 0;
        padding: 0;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .header {
        background-color: #0077b5; /* LinkedIn Blue */
        color: #ffffff;
        padding: 30px;
        text-align: center;
        font-size: 28px;
        font-weight: bold;
        border-radius: 12px 12px 0 0;
      }
      .sub-header {
        background-color: #e1f1ff;
        color: #0077b5;
        padding: 12px;
        text-align: center;
        font-size: 20px;
        font-weight: 600;
        border-radius: 0 0 12px 12px;
      }
      .content {
        padding: 40px;
      }
      .details {
        margin: 25px 0;
        font-size: 16px;
      }
      .date-time {
        font-size: 16px;
        margin-top: 10px;
        font-weight: 600;
      }
      .meet-link-btn, .feedback-btn {
        display: inline-block;
        margin: 20px 0;
        padding: 14px 30px;
        background-color: #0077b5; /* LinkedIn Blue */
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
        font-size: 18px;
        transition: background-color 0.3s ease;
      }
      .meet-link-btn:hover, .feedback-btn:hover {
        background-color: #005f8a; /* Darker LinkedIn Blue */
      }
      .footer {
        background-color: #f4f7f9;
        color: #555;
        text-align: center;
        padding: 20px;
        font-size: 14px;
        border-radius: 0 0 12px 12px;
      }
      .footer a {
        color: #0077b5;
        text-decoration: none;
      }
      h1, p {
        margin: 0;
        padding: 0;
      }
      p {
        margin-bottom: 15px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">SELECTSKILLSET</div>
      <div class="sub-header">Your Interview is Scheduled</div>
      <div class="content">
        <p>Dear ${candidateName},</p>
        <p>We are excited to inform you that your interview has been successfully scheduled. Please find the details below:</p>
        
        <div class="details">
          <p><strong>Interview Date:</strong> ${date}</p>
          <p><strong>Interview Time:</strong> ${time}</p>
          <p><strong>Join the Interview:</strong> <a href="${meetLink}" target="_blank">${meetLink}</a></p>
        </div>
        
        <a href="${meetLink}" class="meet-link-btn">Join Interview</a>
        
        <hr>
        
        <p>After the interview, we kindly request your valuable feedback regarding your interview experience. Your input helps us to improve our process and ensure a better experience for future candidates.</p>
        <p>Please take a moment to rate your experience and provide feedback about your interviewer by clicking the button below:</p>
        
        <a href="${url}/candidate-feedback/${interviewerId}/${interviewRequestId}" class="feedback-btn">Give Feedback & Rate Interviewer</a>
        
        <hr>
        
        <p>Thank you for being a part of the interview process. We wish you the best of luck!</p>
      </div>
      
      <div class="footer">
        This email was sent by <strong>SELECTSKILLSET</strong>. If you have any questions or concerns, please feel free to <a href="mailto:support@selectskillset.com">contact us</a>.
      </div>
    </div>
  </body>
  </html>
`;
