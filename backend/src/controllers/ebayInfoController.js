// ebayInfoController.js
// Controller for eBay Info & Performance endpoints

const EbayInfo = require('../models/ebayInfoModel');
const { Op } = require('sequelize');

// Get eBay info from DB
exports.getEbayInfo = async (req, res) => {
    try {
        const info = await EbayInfo.findOne();
        if (!info) {
            return res.status(404).json({ message: 'eBay info not found' });
        }
        res.json({
            accountId: info.accountId,
            storeName: info.storeName,
            feedbackScore: info.feedbackScore,
            positiveFeedbackPercent: info.positiveFeedbackPercent,
            sellingLimits: info.sellingLimits,
            lastSync: info.lastSync
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching eBay info' });
    }
};

exports.getPerformance = async (req, res) => {
    try {
        const info = await EbayInfo.findOne();
        if (!info) {
            return res.status(404).json({ message: 'eBay info not found' });
        }
        res.json({
            sellerLevel: info.sellerLevel,
            defectRate: info.defectRate,
            lateShipmentRate: info.lateShipmentRate,
            transactionDefectRate: info.transactionDefectRate,
            policyComplianceStatus: info.policyComplianceStatus,
            lastSync: info.lastSync
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching eBay performance' });
    }
};

exports.getApiStatus = async (req, res) => {
    try {
        const info = await EbayInfo.findOne();
        if (!info) {
            return res.status(404).json({ message: 'eBay info not found' });
        }
        res.json({
            apiStatus: info.apiStatus,
            lastSync: info.lastSync
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching eBay API status' });
    }
};

exports.syncEbayInfo = async (req, res) => {
    try {
        // In a real implementation, trigger sync with eBay APIs and update DB
        const info = await EbayInfo.findOne();
        if (!info) {
            return res.status(404).json({ message: 'eBay info not found' });
        }
        info.lastSync = new Date().toISOString();
        await info.save();
        res.json({ message: 'Sync started', status: 'in_progress' });
    } catch (error) {
        res.status(500).json({ message: 'Error syncing eBay info' });
    }
};

// Search/filter eBay info
exports.searchEbayInfo = async (req, res) => {
    try {
        const { storeName, minFeedbackScore, maxFeedbackScore } = req.query;
        const where = {};
        if (storeName) { where.storeName = { [Op.iLike]: `%${storeName}%` }; }
        if (minFeedbackScore || maxFeedbackScore) { where.feedbackScore = {}; }
        if (minFeedbackScore) { where.feedbackScore[Op.gte] = parseInt(minFeedbackScore, 10); }
        if (maxFeedbackScore) { where.feedbackScore[Op.lte] = parseInt(maxFeedbackScore, 10); }
        const infos = await EbayInfo.findAll({ where });
        res.json(infos);
    } catch (error) {
        res.status(500).json({ message: 'Error searching eBay info' });
    }
};
