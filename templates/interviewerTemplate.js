export const interviewerTemplate = (interviewerName, candidateName, date, meetLink) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Scheduled</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f8fafc;
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
        background-color: #0056b3;
        color: #ffffff;
        padding: 25px;
        text-align: center;
        font-size: 26px;
        font-weight: bold;
      }
      .sub-header {
        background-color: #f1f5f9;
        color: #0056b3;
        padding: 10px;
        text-align: center;
        font-size: 18px;
      }
      .content {
        padding: 30px;
      }
      .details {
        margin: 20px 0;
        font-size: 16px;
      }
      .meet-link-btn {
        display: inline-block;
        margin: 20px 0;
        padding: 12px 25px;
        background-color: #0056b3;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
        font-size: 16px;
      }
      .footer {
        background-color: #f8fafc;
        color: #555;
        text-align: center;
        padding: 15px;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">Select Skill Set</div>
      <div class="sub-header">Interview Scheduled</div>
      <div class="content">
        <p>Dear ${interviewerName},</p>
        <p>Your interview with <strong>${candidateName}</strong> has been scheduled. Below are the details:</p>
        <div class="details">
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Meet Link:</strong> <a href="${meetLink}" target="_blank">${meetLink}</a></p>
        </div>
        <a href="${meetLink}" class="meet-link-btn">Join Meeting</a>
      </div>
      <div class="footer">
        This email is sent by Select Skill Set. Contact us at support@selectskillset.com for any assistance.
      </div>
    </div>
  </body>
  </html>
`;
