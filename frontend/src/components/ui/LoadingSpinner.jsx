// src/components/ui/LoadingSpinner.jsx
export const LoadingSpinner = () => {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  };
  
  // src/components/ui/ErrorMessage.jsx
  export const ErrorMessage = ({ message }) => {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{message}</p>
        </div>
      </div>
    );
  };
  
  export default { LoadingSpinner, ErrorMessage };