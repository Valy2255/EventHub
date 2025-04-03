const ErrorMessage = ({ message }) => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
