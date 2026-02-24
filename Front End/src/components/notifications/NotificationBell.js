// Front_end/snp/src/components/notifications/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import { Badge, Dropdown, ListGroup, Button } from 'react-bootstrap';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }

    // Connect to socket server
    socketRef.current = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Listen for new job applications (public event)
    socketRef.current.on('new-job-application', (data) => {
      console.log('📢 New job application notification:', data);
      
      const newNotification = {
        id: Date.now(),
        type: 'job_application',
        message: `New job application from ${data.name}`,
        email: data.email,
        phone: data.phone,
        time: data.time,
        date: data.date,
        appId: data.id,
        read: false
      };
      
      // Add to notifications (keep last 10)
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        try {
          new Notification('🎯 New Job Application', {
            body: `${data.name} applied for a job at ${data.time}`,
            icon: '/favicon.ico',
            tag: 'job-application'
          });
        } catch (err) {
          console.log('Browser notification error:', err);
        }
      }
    });

    // Listen for admin-specific notifications
    socketRef.current.on('admin-notification', (data) => {
      console.log('📢 Admin notification:', data);
      
      const newNotification = {
        id: Date.now(),
        type: data.type || 'admin',
        message: data.message || `New job application from ${data.name}`,
        email: data.email,
        time: data.time,
        date: data.date,
        appId: data.id,
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
      setUnreadCount(prev => prev + 1);
    });

    // Handle connection events
    socketRef.current.on('connect', () => {
      console.log('🔌 Connected to notification server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Disconnected from notification server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTime = (timeStr) => {
    return timeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)} align="end">
      <Dropdown.Toggle 
        variant="link" 
        className="position-relative p-0 text-dark text-decoration-none"
        style={{ background: 'none', border: 'none' }}
      >
        <div className="position-relative">
          <i className="bi bi-bell fs-5"></i>
          {unreadCount > 0 && (
            <Badge
              bg="danger"
              pill
              className="position-absolute"
              style={{ 
                top: '-5px', 
                right: '-5px', 
                fontSize: '0.65rem',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </Dropdown.Toggle>

      <Dropdown.Menu 
        style={{ 
          minWidth: '350px', 
          maxWidth: '350px',
          maxHeight: '400px',
          overflow: 'hidden'
        }}
      >
        <div className="px-3 py-2 d-flex justify-content-between align-items-center border-bottom bg-light">
          <div>
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <Badge bg="primary" pill className="ms-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div>
            {unreadCount > 0 && (
              <Button 
                variant="link" 
                size="sm" 
                className="text-decoration-none p-0 me-2"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="link" 
                size="sm" 
                className="text-decoration-none p-0 text-danger"
                onClick={clearAll}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-bell-slash fs-3 d-block mb-2"></i>
            No notifications yet
            <div className="small mt-1">You'll see job applications here</div>
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <ListGroup variant="flush">
              {notifications.map(notif => (
                <ListGroup.Item
                  key={notif.id}
                  action
                  onClick={() => markAsRead(notif.id)}
                  className={`py-3 ${!notif.read ? 'bg-light' : ''}`}
                >
                  <div className="d-flex align-items-start">
                    <div className="me-2">
                      {notif.type === 'job_application' ? (
                        <span className="text-primary">🎯</span>
                      ) : (
                        <span className="text-info">📢</span>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className={`${!notif.read ? 'fw-bold' : ''}`}>
                          {notif.message}
                        </div>
                        <small className="text-muted text-nowrap ms-2">
                          {formatTime(notif.time)}
                        </small>
                      </div>
                      <div className="mt-1 small text-muted">
                        {notif.email}
                        {notif.phone && notif.phone !== 'Not provided' && ` • ${notif.phone}`}
                      </div>
                      <div className="mt-1 small">
                        <span className="badge bg-secondary">Application #{notif.appId || 'N/A'}</span>
                        <span className="badge bg-light text-dark ms-1">{notif.date}</span>
                      </div>
                    </div>
                    {!notif.read && (
                      <div className="ms-2">
                        <span className="badge bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></span>
                      </div>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}
        
        {notifications.length > 0 && (
          <div className="border-top px-3 py-2 bg-light text-center small">
            <span className="text-muted">
              {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;