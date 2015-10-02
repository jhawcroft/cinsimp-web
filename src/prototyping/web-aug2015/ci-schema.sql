-- phpMyAdmin SQL Dump
-- version 4.1.8
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Sep 17, 2015 at 08:21 AM
-- Server version: 5.5.40-cll
-- PHP Version: 5.4.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `jojo8330_apps`
--

-- --------------------------------------------------------

--
-- Table structure for table `ci_bkgnd`
--

CREATE TABLE IF NOT EXISTS `ci_bkgnd` (
  `bkgnd_id` int(11) NOT NULL AUTO_INCREMENT,
  `stack_id` int(11) NOT NULL,
  `bkgnd_name` varchar(1000) NOT NULL DEFAULT '',
  `object_data` mediumtext NOT NULL,
  `cant_delete` char(1) NOT NULL DEFAULT 'N',
  `dont_search` char(1) NOT NULL DEFAULT 'N',
  `bkgnd_data` mediumtext NOT NULL,
  PRIMARY KEY (`bkgnd_id`),
  KEY `stack_id` (`stack_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=14 ;



-- --------------------------------------------------------

--
-- Table structure for table `ci_card`
--

CREATE TABLE IF NOT EXISTS `ci_card` (
  `card_id` int(11) NOT NULL AUTO_INCREMENT,
  `bkgnd_id` int(11) NOT NULL,
  `card_name` varchar(1000) NOT NULL DEFAULT '',
  `card_seq` int(11) NOT NULL,
  `object_data` mediumtext NOT NULL,
  `cant_delete` char(1) NOT NULL DEFAULT 'N',
  `dont_search` char(1) NOT NULL DEFAULT 'N',
  `marked` char(1) NOT NULL DEFAULT 'N',
  `card_data` mediumtext NOT NULL,
  PRIMARY KEY (`card_id`),
  KEY `bkgnd_id` (`bkgnd_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=28 ;



-- --------------------------------------------------------

--
-- Table structure for table `ci_stack`
--

CREATE TABLE IF NOT EXISTS `ci_stack` (
  `stack_id` int(11) NOT NULL AUTO_INCREMENT,
  `stack_name` varchar(1000) NOT NULL,
  `password_hash` varchar(100) DEFAULT NULL,
  `private_access` char(1) NOT NULL DEFAULT 'N',
  `stack_data` mediumtext NOT NULL,
  `cant_delete` char(1) NOT NULL DEFAULT 'N',
  `cant_modify` char(1) NOT NULL DEFAULT 'N',
  PRIMARY KEY (`stack_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;



-- --------------------------------------------------------

--
-- Table structure for table `sys_file`
--

CREATE TABLE IF NOT EXISTS `sys_file` (
  `file_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `owner_id` int(11) NOT NULL,
  `name` varchar(1000) NOT NULL,
  `comment` text,
  `acl` varchar(1000) DEFAULT NULL,
  `date_created` datetime NOT NULL,
  `date_modified` datetime NOT NULL,
  `date_accessed` datetime NOT NULL,
  `kind` int(11) NOT NULL,
  `keywords` varchar(1000) NOT NULL DEFAULT '',
  `size` bigint(20) NOT NULL DEFAULT '0',
  `data` longblob NOT NULL,
  `meta` text,
  PRIMARY KEY (`file_id`),
  KEY `name` (`name`(767),`date_created`,`date_modified`,`date_accessed`,`keywords`(767),`size`),
  KEY `kind` (`kind`),
  KEY `size` (`size`),
  KEY `keywords` (`keywords`(767)),
  KEY `date_accessed` (`date_accessed`),
  KEY `date_modified` (`date_modified`),
  KEY `date_created` (`date_created`),
  KEY `owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `sys_file_attr`
--

CREATE TABLE IF NOT EXISTS `sys_file_attr` (
  `attr_id` int(11) NOT NULL,
  `file_id` bigint(20) NOT NULL,
  PRIMARY KEY (`attr_id`,`file_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `sys_file_link`
--

CREATE TABLE IF NOT EXISTS `sys_file_link` (
  `parent_id` bigint(20) NOT NULL,
  `child_id` bigint(20) NOT NULL,
  PRIMARY KEY (`parent_id`,`child_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `sys_meta_attr`
--

CREATE TABLE IF NOT EXISTS `sys_meta_attr` (
  `attr_id` int(11) NOT NULL AUTO_INCREMENT,
  `attr_name` varchar(200) NOT NULL,
  `is_archive` char(1) NOT NULL DEFAULT 'N',
  PRIMARY KEY (`attr_id`),
  UNIQUE KEY `attr_name` (`attr_name`),
  KEY `is_archive` (`is_archive`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `sys_user`
--

CREATE TABLE IF NOT EXISTS `sys_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `common_name` varchar(50) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(200) NOT NULL,
  `auth_phrase` varchar(200) NOT NULL,
  `suspend` char(1) NOT NULL DEFAULT 'N',
  `admin` char(1) NOT NULL DEFAULT 'N',
  `reset_cookie` varchar(100) NOT NULL,
  `last_access` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `full_name` (`full_name`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;



--
-- Constraints for dumped tables
--

--
-- Constraints for table `ci_bkgnd`
--
ALTER TABLE `ci_bkgnd`
  ADD CONSTRAINT `ci_bkgnd_ibfk_1` FOREIGN KEY (`stack_id`) REFERENCES `ci_stack` (`stack_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ci_card`
--
ALTER TABLE `ci_card`
  ADD CONSTRAINT `ci_card_ibfk_1` FOREIGN KEY (`bkgnd_id`) REFERENCES `ci_bkgnd` (`bkgnd_id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
