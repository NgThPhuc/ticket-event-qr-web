import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      style={{
        backgroundColor: isDark ? '#3b82f6' : '#ffffff',
        border: isDark ? 'none' : '1px solid #e5e7eb',
      }}
      aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
    >
      {/* Slider */}
      <span
        className={`absolute inline-block h-6 w-6 rounded-full bg-white transition-all duration-300 flex items-center justify-center ${
          isDark ? 'left-[calc(100%-1.5rem-0.25rem)]' : 'left-1'
        }`}
      >
        {/* Icon */}
        {isDark ? (
          // Sun icon (dark mode active)
          <svg
            className="w-4 h-4 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          // Moon icon (light mode)
          <svg
            className="w-4 h-4 text-gray-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;

