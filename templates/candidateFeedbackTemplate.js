export const candidateFeedbackTemplate = (candidateName, latestFeedbacks, url) => {
  const visibleFeedbacks = latestFeedbacks.slice(0, 2);
  const hiddenFeedbacks = latestFeedbacks.slice(2, 3); 

  const getStarRating = (rating) => {
    const filledStars = Math.round(rating); 
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= filledStars) {
        starsHtml += `<span style="color: #FFD700; font-size: 18px;">&#9733;</span>`;
      } else {
        starsHtml += `<span style="color: #dcdcdc; font-size: 18px;">&#9733;</span>`; 
      }
    }
    return starsHtml;
  };

  const visibleFeedbackHtml = visibleFeedbacks
    .map(
      (feedbackSection) => `
              <div
                style="
                  margin-bottom: 20px;
                  padding: 20px;
                  border: 1px solid #d9e1e8;
                  border-radius: 8px;
                  background-color: #f3f6f9;
                "
              >
                <h3 style="font-size: 20px; color: #283e4a; font-weight: bold;">
                  ${feedbackSection.section}
                </h3>
                <p style="font-size: 16px; color: #495869;">
                  <strong>Rating:</strong> ${getStarRating(
                    feedbackSection.rating
                  )}
                </p>
                <p style="font-size: 16px; color: #495869;">
                  <strong>Comment:</strong> ${feedbackSection.comment}
                </p>
              </div>
            `
    )
    .join("");

  const hiddenFeedbackHtml = hiddenFeedbacks
    .map(
      (feedbackSection) => `
              <div
                style="
                  opacity: 0.4;
                  pointer-events: none;
                  margin-bottom: 20px;
                  padding: 20px;
                  border: 1px solid #d9e1e8;
                  border-radius: 8px;
                  background-color: #f3f6f9;
                "
              >
                <p
                  style="
                    font-size: 16px;
                    font-style: italic;
                    color:  #0073b1;
                    text-align: center;
                    font-weight: bolder;
                  "
                >
                  Feedback hidden...
                </p>
              </div>
            `
    )
    .join("");

  return `
          <div
            style="
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.8;
              color: #495869;
              padding: 20px;
              max-width: 700px;
              margin: auto;
              border: 1px solid #d9e1e8;
              border-radius: 15px;
              background-color: #ffffff;
              box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
            "
          >
            <!-- Header -->
            <header style="text-align: center; margin-bottom: 30px">
              <h1 style="font-size: 28px; color: #0073b1; margin: 0">SELECTSKILLSET</h1>
              <p style="font-size: 18px; color: #283e4a; margin-top: 10px">
                Unlock your potential with detailed feedback
              </p>
            </header>
          
            <!-- Main Content -->
            <section>
              <h2
                style="font-size: 24px; color: #283e4a; text-align: center; margin-bottom: 20px"
              >
                Hello ${candidateName},
              </h2>
              <p style="font-size: 16px; color: #495869; text-align: center">
                Your interview feedback is here! Take a look at the key highlights and discover valuable insights:
              </p>
          
              <!-- Visible Feedback Section -->
              <div style="margin-top: 20px">${visibleFeedbackHtml}</div>
          
              <!-- Suspense Section -->
              <div
                style="
                  margin-top: 30px;
                  position: relative;
                  background-color: #f8f9fa;
                  padding: 20px;
                  border-radius: 10px;
                  text-align: center;
                  overflow: hidden;
                "
              >
                <div
                  style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #ffffff);
                    z-index: 1;
                  "
                ></div>
                <div style="opacity: 0.6; filter: blur(8px)">${hiddenFeedbackHtml}</div>
                
                <!-- Unlock Button -->
                <div style="text-align: center; margin-top: 20px">
                  <a
                    href="${url}/candidate-login"
                    style="
                      display: inline-block;
                      padding: 15px 30px;
                      background-color: #0073b1;
                      color: #ffffff;
                      text-decoration: none;
                      border-radius: 30px;
                      font-size: 18px;
                      font-weight: bold;
                      transition: background-color 0.3s ease;
                    "
                  >
                    View All Feedbacks
                  </a>
                </div>
              </div>
            </section>
          
            <!-- Footer -->
            <footer
              style="margin-top: 40px; text-align: center; font-size: 14px; color: #8696a0"
            >
              <p style="margin: 0">
                This email was sent to you by <strong>SELECTSKILLSET</strong>. We strive
                to provide personalized career insights to help you succeed.
              </p>
              <p style="margin: 5px 0">
                Visit your
                <a
                  href="${url}"
                  style="color: #0073b1; text-decoration: none"
                  >dashboard</a
                >
                for more details.
              </p>
            </footer>
          </div>
        `;
};
