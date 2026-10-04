const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div role="status" aria-live="polite">
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
