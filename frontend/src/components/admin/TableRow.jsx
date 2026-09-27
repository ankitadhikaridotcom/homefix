const TableRow = ({ children, className = '', onClick, isHeader = false }) => {
  if (isHeader) {
    return (
      <tr className={`table-header ${className}`}>
        {children}
      </tr>
    );
  }

  return (
    <tr
      onClick={onClick}
      className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors
                ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export default TableRow;
