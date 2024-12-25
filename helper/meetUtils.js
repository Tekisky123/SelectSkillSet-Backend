// meetUtils.js

const meetLinks = [
    "https://meet.google.com/xbn-baxk-deo",
    "https://meet.google.com/yqr-rxwu-qwe",
    "https://meet.google.com/ajk-fgeo-xyz",
    "https://meet.google.com/pzy-qnvo-123",
    "https://meet.google.com/tuv-wxyz-abc",
  ];
  
  let linkIndex = 0;
  
  /**
   * Fetch the next Google Meet link from the array in a circular manner.
   * @returns {string} Google Meet link
   */
  const getNextMeetLink = () => {
    const link = meetLinks[linkIndex];
    linkIndex = (linkIndex + 1) % meetLinks.length; // Circular array
    return link;
  };
  
  export { getNextMeetLink };
  