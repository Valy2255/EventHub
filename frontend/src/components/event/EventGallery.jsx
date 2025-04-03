// src/components/event/EventGallery.jsx
import { useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaTimes, FaExpand } from 'react-icons/fa';

const EventGallery = ({ mainImage, images = [], imagePlaceholder = '/placeholder.jpg' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // For now, we only have the main image, but this component supports multiple images
  const allImages = [mainImage, ...images].filter(Boolean);
  
  // Use placeholder if no images are available
  if (allImages.length === 0) {
    allImages.push(imagePlaceholder);
  }
  
  const openModal = (index) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };
  
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? allImages.length - 1 : prevIndex - 1
    );
  };
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  return (
    <>
      {/* Main Gallery */}
      <div className="mt-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Image */}
          <div 
            className="md:col-span-2 cursor-pointer aspect-video relative overflow-hidden rounded-lg"
            onClick={() => openModal(0)}
          >
            <img 
              src={allImages[0]} 
              alt="Event main image" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <button
              className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                openModal(0);
              }}
            >
              <FaExpand />
            </button>
          </div>
          
          {/* Thumbnail Grid - if we have more than one image */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-2 gap-2">
              {allImages.slice(1, 5).map((image, index) => (
                <div 
                  key={index} 
                  className="cursor-pointer aspect-square relative overflow-hidden rounded-lg"
                  onClick={() => openModal(index + 1)}
                >
                  <img 
                    src={image} 
                    alt={`Event image ${index + 2}`} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
              
              {/* Show placeholder thumbnails if we have less than 4 additional images */}
              {Array.from({ length: Math.max(0, 4 - (allImages.length - 1)) }).map((_, index) => (
                <div key={`placeholder-${index}`} className="aspect-square bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Lightbox Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button
            className="absolute top-4 right-4 text-white text-2xl p-2 hover:bg-white hover:bg-opacity-20 rounded-full z-10"
            onClick={closeModal}
          >
            <FaTimes />
          </button>
          
          <button
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
            onClick={goToPrevious}
          >
            <FaArrowLeft />
          </button>
          
          <div className="w-full max-w-4xl max-h-full p-4">
            <img
              src={allImages[currentIndex]}
              alt={`Event image ${currentIndex + 1}`}
              className="max-w-full max-h-[80vh] mx-auto object-contain"
            />
          </div>
          
          <button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
            onClick={goToNext}
          >
            <FaArrowRight />
          </button>
          
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <div className="bg-black bg-opacity-50 px-4 py-2 rounded-full text-white">
              {currentIndex + 1} / {allImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventGallery;