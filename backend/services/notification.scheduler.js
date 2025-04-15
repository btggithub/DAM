// backend/services/notification.scheduler.js
const cron = require('node-cron');
const emailService = require('./email.service');

// Notification thresholds for domain and account expiry (in days)
const EXPIRY_THRESHOLDS = [30, 14, 7, 3, 1];

// Calculate days between two dates
const getDaysDifference = (date1, date2) => {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Process domain expiry notifications
const processDomainExpiryNotifications = async () => {
  const today = new Date();
  
  try {
    // Get all domains with user_id
    const [domains] = await global.db.query(`
      SELECT d.*, u.id as user_id, p.provider_name
      FROM domains d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN providers p ON d.provider_id = p.provider_id
      WHERE d.expiry_date IS NOT NULL
    `);

    // Check each domain for upcoming expiry
    for (const domain of domains) {
      if (!domain.expiry_date) continue;
      
      const expiryDate = new Date(domain.expiry_date);
      const daysUntilExpiry = getDaysDifference(today, expiryDate);
      
      // Check if days until expiry matches any of our thresholds
      if (EXPIRY_THRESHOLDS.includes(daysUntilExpiry)) {
        console.log(`Sending notification for domain ${domain.domain_name} (expires in ${daysUntilExpiry} days)`);
        
        try {
          await emailService.sendDomainExpiryNotification(
            domain.user_id,
            domain,
            daysUntilExpiry
          );
          
          // Log notification in database
          await global.db.query(`
            INSERT INTO notifications (user_id, type, entity_id, days_until_expiry, sent_at)
            VALUES (?, ?, ?, ?, NOW())
          `, [domain.user_id, 'domain', domain.domain_id, daysUntilExpiry]);
          
        } catch (notificationError) {
          console.error(`Failed to send notification for domain ${domain.domain_id}:`, notificationError);
        }
      }
    }
    
    console.log('Domain expiry notification check completed');
  } catch (error) {
    console.error('Error processing domain expiry notifications:', error);
  }
};

// Process account expiry notifications
const processAccountExpiryNotifications = async () => {
  const today = new Date();
  
  try {
    // Get all providers with user_id and account_expiry_date
    const [providers] = await global.db.query(`
      SELECT p.*, u.id as user_id
      FROM providers p
      JOIN users u ON p.user_id = u.id
      WHERE p.account_expiry_date IS NOT NULL
    `);

    // Check each provider for upcoming renewal
    for (const provider of providers) {
      const expiryDate = new Date(provider.account_expiry_date);
      const daysUntilExpiry = getDaysDifference(today, expiryDate);
      
      // Check if days until expiry matches any of our thresholds
      if (EXPIRY_THRESHOLDS.includes(daysUntilExpiry)) {
        console.log(`Sending notification for provider ${provider.provider_name} (expires in ${daysUntilExpiry} days)`);
        
        try {
          await emailService.sendAccountExpiryNotification(
            provider.user_id,
            provider,
            daysUntilExpiry
          );
          
          // Log notification in database
          await global.db.query(`
            INSERT INTO notifications (user_id, type, entity_id, days_until_expiry, sent_at)
            VALUES (?, ?, ?, ?, NOW())
          `, [provider.user_id, 'provider', provider.provider_id, daysUntilExpiry]);
          
        } catch (notificationError) {
          console.error(`Failed to send notification for provider ${provider.provider_id}:`, notificationError);
        }
      }
    }
    
    console.log('Account expiry notification check completed');
  } catch (error) {
    console.error('Error processing account expiry notifications:', error);
  }
};

// Schedule jobs
// Run domain expiry check daily at 8:00 AM
const scheduleDomainNotifications = () => {
  return cron.schedule('0 8 * * *', () => {
    console.log('Running domain expiry notification check...');
    processDomainExpiryNotifications();
  });
};

// Run account expiry check daily at 8:30 AM
const scheduleAccountNotifications = () => {
  return cron.schedule('30 8 * * *', () => {
    console.log('Running account expiry notification check...');
    processAccountExpiryNotifications();
  });
};

// Create database table for notifications if it doesn't exist
const setupNotificationsTable = async () => {
  try {
    await global.db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('domain', 'provider') NOT NULL,
        entity_id INT NOT NULL,
        days_until_expiry INT NOT NULL,
        sent_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('Notifications table created or already exists');
  } catch (error) {
    console.error('Error creating notifications table:', error);
  }
};

// Initialize and start all notification services
exports.initNotificationServices = async () => {
  try {
    // Setup database table
    await setupNotificationsTable();
    
    // Schedule notifications
    const domainJob = scheduleDomainNotifications();
    const accountJob = scheduleAccountNotifications();
    
    console.log('Notification services initialized');
    
    // Run initial checks (optional)
    processDomainExpiryNotifications();
    processAccountExpiryNotifications();
    
    return {
      domainJob,
      accountJob
    };
  } catch (error) {
    console.error('Error initializing notification services:', error);
    throw error;
  }
};

// Manual trigger for testing
exports.triggerDomainExpiryCheck = async () => {
  console.log('Manually triggering domain expiry check');
  await processDomainExpiryNotifications();
  return { success: true, message: 'Domain expiry check completed' };
};

exports.triggerAccountExpiryCheck = async () => {
  console.log('Manually triggering account expiry check');
  await processAccountExpiryNotifications();
  return { success: true, message: 'Account expiry check completed' };
};