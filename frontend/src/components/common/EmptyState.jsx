const EmptyState = ({
  title = "Nothing here yet",
  message = "There is currently no data to display.",
}) => {
  return (
    <div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;
