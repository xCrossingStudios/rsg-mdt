-- RSG MDT Database Schema
-- Import this file into your database before using the MDT

-- Criminal Records Table
CREATE TABLE IF NOT EXISTS `mdt_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `citizenid` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `crime` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `fine` INT DEFAULT 0,
    `jailtime` INT DEFAULT 0,
    `officer` VARCHAR(100) NOT NULL,
    `officer_cid` VARCHAR(50),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_citizenid` (`citizenid`),
    INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Warrants Table
CREATE TABLE IF NOT EXISTS `mdt_warrants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `citizenid` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('active', 'served', 'expired') DEFAULT 'active',
    `officer` VARCHAR(100) NOT NULL,
    `officer_cid` VARCHAR(50),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_citizenid` (`citizenid`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BOLOs (Be On Lookout) Table
CREATE TABLE IF NOT EXISTS `mdt_bolos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `last_seen` VARCHAR(255),
    `officer` VARCHAR(100) NOT NULL,
    `officer_cid` VARCHAR(50),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reports Table
CREATE TABLE IF NOT EXISTS `mdt_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) DEFAULT 'incident',
    `description` TEXT,
    `officers` JSON,
    `suspects` JSON,
    `evidence` JSON,
    `officer` VARCHAR(100) NOT NULL,
    `officer_cid` VARCHAR(50),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_type` (`type`),
    INDEX `idx_officer` (`officer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Report Comments (case building)
CREATE TABLE IF NOT EXISTS `mdt_report_comments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `report_id` INT NOT NULL,
    `author` VARCHAR(100) NOT NULL,
    `author_cid` VARCHAR(50),
    `content` TEXT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_report_id` (`report_id`),
    FOREIGN KEY (`report_id`) REFERENCES `mdt_reports`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Citizen Profiles (MDT-specific data like profile pictures)
CREATE TABLE IF NOT EXISTS `mdt_citizen_profiles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `citizenid` VARCHAR(50) NOT NULL UNIQUE,
    `profile_picture` VARCHAR(512),
    `notes` TEXT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_citizenid` (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
