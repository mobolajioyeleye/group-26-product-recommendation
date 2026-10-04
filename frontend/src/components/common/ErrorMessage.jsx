const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div role="alert">
      <p>{message}</p>

      {onRetry && (
        <button type="button" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
