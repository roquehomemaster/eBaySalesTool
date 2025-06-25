import React from 'react';
import PropTypes from 'prop-types';

const typeStyles = {
  error: { background: '#ffe5e5', color: '#b71c1c', border: '1px solid #b71c1c' },
  warning: { background: '#fff8e1', color: '#ff6f00', border: '1px solid #ff6f00' },
  info: { background: '#e3f2fd', color: '#1565c0', border: '1px solid #1565c0' },
  success: { background: '#e8f5e9', color: '#2e7d32', border: '1px solid #2e7d32' },
};

function SystemMessage({ message, type = 'info', onClose }) {
  if (!message) return null;
  return (
    <div style={{
      ...typeStyles[type],
      padding: '12px 16px',
      borderRadius: 4,
      margin: '16px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontWeight: 500,
    }}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ marginLeft: 16, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}>
          ×
        </button>
      )}
    </div>
  );
}

SystemMessage.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  onClose: PropTypes.func,
};

export default SystemMessage;
