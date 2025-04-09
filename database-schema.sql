-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS u265890320_dam_db;

USE u265890320_dam_db;

-- Providers table (both hosting and domain providers)
CREATE TABLE providers (
    provider_id INT PRIMARY KEY AUTO_INCREMENT,
    provider_name VARCHAR(100) NOT NULL,
    provider_type ENUM('hosting', 'domain', 'both') NOT NULL,
    username VARCHAR(100),
    password VARCHAR(255),  -- In production, ensure this is properly hashed
    account_expiry_date DATE,
    website VARCHAR(255),
    notes TEXT,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Domains table
CREATE TABLE domains (
    domain_id INT PRIMARY KEY AUTO_INCREMENT,
    domain_name VARCHAR(255) NOT NULL UNIQUE,
    provider_id INT,
    registration_date DATE,
    expiry_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (provider_id) REFERENCES providers(provider_id) ON DELETE SET NULL
);

-- Nameservers table
CREATE TABLE nameservers (
    nameserver_id INT PRIMARY KEY AUTO_INCREMENT,
    domain_id INT NOT NULL,
    nameserver_value VARCHAR(255) NOT NULL,
    nameserver_order INT NOT NULL,  -- To maintain order (ns1, ns2, etc.)
    FOREIGN KEY (domain_id) REFERENCES domains(domain_id) ON DELETE CASCADE
);

-- Websites/Hosting table
CREATE TABLE websites (
    website_id INT PRIMARY KEY AUTO_INCREMENT,
    website_name VARCHAR(255) NOT NULL,
    domain_id INT,
    hosting_provider_id INT,
    hosting_package VARCHAR(100),
    ip_address VARCHAR(45),
    is_active BOOLEAN DEFAULT TRUE,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(domain_id) ON DELETE SET NULL,
    FOREIGN KEY (hosting_provider_id) REFERENCES providers(provider_id) ON DELETE SET NULL
);

-- Adding indexes for better performance
CREATE INDEX idx_provider_type ON providers(provider_type);
CREATE INDEX idx_domain_expiry ON domains(expiry_date);
CREATE INDEX idx_domain_provider ON domains(provider_id);
CREATE INDEX idx_website_hosting ON websites(hosting_provider_id);
CREATE INDEX idx_website_domain ON websites(domain_id);

-- Sample data insertion
INSERT INTO providers (provider_name, provider_type, username, password, account_expiry_date, website)
VALUES 
('HostGator', 'hosting', 'user123', 'password123', '2025-12-31', 'https://www.hostgator.com'),
('Namecheap', 'domain', 'user456', 'password456', '2026-06-30', 'https://www.namecheap.com'),
('Bluehost', 'both', 'user789', 'password789', '2025-10-15', 'https://www.bluehost.com');

INSERT INTO domains (domain_name, provider_id, registration_date, expiry_date, auto_renew)
VALUES 
('example.com', 2, '2023-01-15', '2026-01-15', TRUE),
('mywebsite.org', 3, '2022-05-10', '2025-05-10', FALSE),
('domain-test.net', 2, '2023-08-22', '2025-08-22', TRUE);

INSERT INTO nameservers (domain_id, nameserver_value, nameserver_order)
VALUES 
(1, 'ns1.namecheap.com', 1),
(1, 'ns2.namecheap.com', 2),
(2, 'ns1.bluehost.com', 1),
(2, 'ns2.bluehost.com', 2),
(3, 'ns1.namecheap.com', 1),
(3, 'ns2.namecheap.com', 2);

INSERT INTO websites (website_name, domain_id, hosting_provider_id, hosting_package, ip_address)
VALUES 
('My Blog', 1, 1, 'Basic Hosting', '123.456.789.10'),
('Company Site', 2, 3, 'Business Pro', '98.76.54.32'),
('Test Project', 3, 1, 'Developer Package', '111.222.333.44');