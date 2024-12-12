const otpEmailTemplate = (otp) => {
  return `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 50px auto;
              background-color: #fff;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 24px;
              color: #4CAF50;
            }
            .content {
              font-size: 16px;
              line-height: 1.5;
              margin-bottom: 20px;
            }
            .otp-box {
              display: flex;
              justify-content: center;
              margin-bottom: 20px;
            }
            .otp-box input {
              width: 50px;
              height: 50px;
              font-size: 24px;
              text-align: center;
              margin: 0 5px;
              border: 1px solid #ccc;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 14px;
              color: #777;
            }
            .copy-note {
              font-size: 14px;
              color: #888;
              text-align: center;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OTP Verification</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to send you a One-Time Password (OTP) for verification.</p>
              <p>Your OTP code is:</p>
              <div class="otp-box">
              <input type="text" value="${otp[0]}" readonly />
              <input type="text" value="${otp[1]}" readonly />
              <input type="text" value="${otp[2]}" readonly />
              <input type="text" value="${otp[3]}" readonly />
              <input type="text" value="${otp[4]}" readonly />
              <input type="text" value="${otp[5]}" readonly />
            </div>
              <p>If you did not request this, please ignore this email.</p>
              
            </div>
            <div class="footer">
              <p>Thank you for using our service!</p>
            </div>
          </div>
        </body>
      </html>
    `;
};

export default otpEmailTemplate;
