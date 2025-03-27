import React, { useState, useEffect, useRef } from 'react';
import { FaCalendar, FaChevronLeft, FaChevronRight, FaChevronDown } from 'react-icons/fa';

const DatePicker = ({ 
  onDateSelect, 
  initialStartDate = null, 
  initialEndDate = null,
  variant = 'default' // 'default' or 'header'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [isSelectingStart, setIsSelectingStart] = useState(true);
  const [hoveredDate, setHoveredDate] = useState(null);
  
  // For dual month view
  const [leftMonth, setLeftMonth] = useState(new Date());
  const [rightMonth, setRightMonth] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  });
  
  const [startInputValue, setStartInputValue] = useState(
    initialStartDate ? formatInputDate(initialStartDate) : ''
  );
  const [endInputValue, setEndInputValue] = useState(
    initialEndDate ? formatInputDate(initialEndDate) : ''
  );
  
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Update input fields when dates change
  useEffect(() => {
    if (startDate) {
      setStartInputValue(formatInputDate(startDate));
    } else {
      setStartInputValue('');
    }
  }, [startDate]);
  
  useEffect(() => {
    if (endDate) {
      setEndInputValue(formatInputDate(endDate));
    } else {
      setEndInputValue('');
    }
  }, [endDate]);
  
  // Initialize from props
  useEffect(() => {
    if (initialStartDate) {
      setStartDate(initialStartDate);
    }
    if (initialEndDate) {
      setEndDate(initialEndDate);
    }
  }, [initialStartDate, initialEndDate]);

  // Function to format date for input fields
  function formatInputDate(date) {
    if (!date) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }
  
  // Function to parse input value to date
  function parseInputDate(value) {
    if (!value) return null;
    
    const [month, day, year] = value.split('/');
    if (!month || !day || !year) return null;
    
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  }

  // Navigate months - Fixed to prevent form submission
  const navigateMonths = (direction, e) => {
    // Prevent form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const newLeftMonth = new Date(leftMonth);
    newLeftMonth.setMonth(leftMonth.getMonth() + direction);
    setLeftMonth(newLeftMonth);
    
    const newRightMonth = new Date(newLeftMonth);
    newRightMonth.setMonth(newLeftMonth.getMonth() + 1);
    setRightMonth(newRightMonth);
  };

  // Generate calendar days for a month
  const generateCalendarDays = (year, month) => {
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Days from previous month to fill initial empty slots
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Previous month's days
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    
    if (isSelectingStart || !startDate || date < startDate) {
      setStartDate(date);
      setIsSelectingStart(false);
      
      // If selecting a start date after end date, clear end date
      if (endDate && date > endDate) {
        setEndDate(null);
      }
    } else {
      setEndDate(date);
      setIsSelectingStart(true);
    }
  };
  
  const handleInputChange = (e, isStart) => {
    const value = e.target.value;
    
    if (isStart) {
      setStartInputValue(value);
    } else {
      setEndInputValue(value);
    }
  };
  
  const handleInputBlur = (isStart) => {
    if (isStart) {
      const date = parseInputDate(startInputValue);
      if (date) {
        setStartDate(date);
        if (endDate && date > endDate) {
          setEndDate(null);
        }
      } else {
        setStartInputValue(startDate ? formatInputDate(startDate) : '');
      }
    } else {
      const date = parseInputDate(endInputValue);
      if (date && startDate && date >= startDate) {
        setEndDate(date);
      } else {
        setEndInputValue(endDate ? formatInputDate(endDate) : '');
      }
    }
  };

  // Fixed reset dates function to properly clear the state and notify parent
  const resetDates = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setStartDate(null);
    setEndDate(null);
    setStartInputValue('');
    setEndInputValue('');
    setIsSelectingStart(true);
    
    // Important: Call onDateSelect with null values to update parent component
    if (onDateSelect) {
      onDateSelect({ startDate: null, endDate: null });
    }
  };
  
  // Fixed apply dates function
  const applyDates = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (onDateSelect) {
      onDateSelect({ startDate, endDate });
    }
    setIsOpen(false);
  };
  
  const handleMouseEnter = (date) => {
    if (!isSelectingStart && startDate && date > startDate) {
      setHoveredDate(date);
    }
  };
  
  const handleMouseLeave = () => {
    setHoveredDate(null);
  };

  // For a day in the calendar, check if it's selected or in range
  const getDayState = (day) => {
    if (!day) return { isSelected: false, isInRange: false, isHovered: false };
    
    const isStartDate = startDate && day.toDateString() === startDate.toDateString();
    const isEndDate = endDate && day.toDateString() === endDate.toDateString();
    const isSelected = isStartDate || isEndDate;
    
    const isInRange = startDate && endDate && 
                      day > startDate && day < endDate;
    
    const isInHoveredRange = startDate && hoveredDate && !endDate &&
                           day > startDate && day <= hoveredDate;
    
    return { 
      isSelected, 
      isInRange: isInRange || isInHoveredRange,
      isStartDate,
      isEndDate
    };
  };

  // Format month name for display
  const formatMonthName = (date) => {
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  // Render a month's calendar
  const renderCalendarMonth = (year, month) => {
    const days = generateCalendarDays(year, month);
    
    return (
      <div className="calendar-month">
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs text-gray-500 font-semibold mb-2">{day}</div>
          ))}
          {days.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="h-8"></div>;
            
            const { isSelected, isInRange, isStartDate, isEndDate } = getDayState(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            let dayClasses = 'h-8 w-8 flex items-center justify-center text-sm rounded-full mx-auto ';
            
            if (isSelected) {
              dayClasses += 'bg-purple-600 text-white ';
            } else if (isInRange) {
              dayClasses += 'bg-purple-100 text-purple-800 ';
            } else {
              dayClasses += 'hover:bg-purple-50 text-gray-700 ';
            }
            
            if (isToday && !isSelected && !isInRange) {
              dayClasses += 'border border-purple-400 ';
            }
            
            return (
              <div 
                key={day.toDateString()} 
                className="py-1 relative"
              >
                {/* Start and end date background fill */}
                {(isStartDate || isEndDate) && isInRange && (
                  <div className={`absolute top-1/2 h-8 bg-purple-100 -mt-4 ${isStartDate ? 'right-0 left-1/2' : 'left-0 right-1/2'}`}></div>
                )}
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDateSelect(day);
                  }}
                  onMouseEnter={() => handleMouseEnter(day)}
                  onMouseLeave={handleMouseLeave}
                  className={dayClasses}
                >
                  {day.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Determine display text for the date picker button
  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${formatInputDate(startDate)} - ${formatInputDate(endDate)}`;
    } else if (startDate) {
      return formatInputDate(startDate);
    }
    return 'All Dates';
  };

  // Determine classes based on variant
  const containerClasses = variant === 'header' 
    ? 'flex items-center h-full px-3 cursor-pointer relative' 
    : 'relative w-full h-full';

  const displayClasses = variant === 'header'
    ? 'flex items-center w-full py-2 outline-none text-gray-800 text-sm'
    : 'w-full py-2 px-3 border border-gray-300 rounded text-sm text-gray-800';

  // FIXED: Changed the dropdown positioning to always be below the container
  const dropdownClasses = 'absolute z-50 mt-1 w-[650px] origin-top-left left-0 top-full';

  return (
    <div className={containerClasses} ref={containerRef}>
      <div 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={displayClasses}
      >
        <FaCalendar className="text-gray-400 mr-2" />
        <span className="truncate flex-grow">{getDisplayText()}</span>
        {variant === 'header' && (
          <FaChevronDown className="ml-1 text-gray-400" size={10} />
        )}
      </div>

      {isOpen && (
        <div className={`${dropdownClasses} bg-white rounded-lg shadow-lg p-4 border border-gray-200`}>
          {/* Input fields */}
          <div className="flex justify-between mb-4 gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="text"
                value={startInputValue}
                onChange={(e) => handleInputChange(e, true)}
                onBlur={() => handleInputBlur(true)}
                placeholder="MM/DD/YYYY"
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                type="text"
                value={endInputValue}
                onChange={(e) => handleInputChange(e, false)}
                onBlur={() => handleInputBlur(false)}
                placeholder="MM/DD/YYYY"
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
          
          {/* Month navigation - Fixed to prevent form submission */}
          <div className="flex justify-between items-center mb-2">
            <button 
              type="button"
              onClick={(e) => navigateMonths(-1, e)}
              className="text-purple-600 hover:bg-purple-100 p-2 rounded-full"
              aria-label="Previous month"
            >
              <FaChevronLeft />
            </button>
            
            <div className="flex justify-around flex-grow text-center">
              <span className="font-medium text-gray-800">
                {formatMonthName(leftMonth)}
              </span>
              <span className="font-medium text-gray-800">
                {formatMonthName(rightMonth)}
              </span>
            </div>
            
            <button 
              type="button"
              onClick={(e) => navigateMonths(1, e)}
              className="text-purple-600 hover:bg-purple-100 p-2 rounded-full"
              aria-label="Next month"
            >
              <FaChevronRight />
            </button>
          </div>

          {/* Calendars container */}
          <div className="flex gap-4 border-t border-gray-200 pt-2">
            <div className="flex-1">
              {renderCalendarMonth(leftMonth.getFullYear(), leftMonth.getMonth())}
            </div>
            <div className="flex-1">
              {renderCalendarMonth(rightMonth.getFullYear(), rightMonth.getMonth())}
            </div>
          </div>

          {/* Footer actions - Fixed to prevent form submission */}
          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
            <button 
              type="button"
              onClick={resetDates}
              className="text-purple-600 hover:bg-purple-100 px-4 py-2 rounded text-sm"
            >
              Reset
            </button>
            <div className="flex space-x-2">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-gray-700 hover:bg-gray-100 px-4 py-2 rounded text-sm border border-gray-300"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={applyDates}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;