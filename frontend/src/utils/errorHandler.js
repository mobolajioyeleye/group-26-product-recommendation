export const getErrorMessage = (error) => {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const status = error.response?.status;

  // Network/server unreachable error
  if (
    !error.response &&
    (error.name === "TypeError" ||
      error.message === "Failed to fetch" ||
      error.message?.toLowerCase().includes("network"))
  ) {
    return "Unable to connect to server. Please check your connection and try again.";
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  switch (status) {
    case 400:
      return "Invalid request. Please check your information.";

    case 401:
      return "Please log in to continue.";

    case 403:
      return "You do not have permission to perform this action.";

    case 404:
      return "The requested resource could not be found.";

    case 409:
      return "This information already exists.";

    case 500:
      return "Server error. Please try again later.";

    default:
      return "Something went wrong. Please try again.";
  }
};