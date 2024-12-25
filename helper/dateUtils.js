const formatDateToGMT = (dateTime) => {
    const date = new Date(dateTime);
    return date.toUTCString();
  };
  
  export { formatDateToGMT };
  