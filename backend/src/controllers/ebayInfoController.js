// ebayInfoController.js
// Controller for eBay Info & Performance endpoints

const EbayInfo = require('../models/ebayInfoModel');
const { Op } = require('sequelize');

// Get eBay info from DB
exports.getEbayInfo = async (req, res) => {
    try {
    const info = await EbayInfo.findOne({ order: [['last_sync', 'DESC']] });
        if (!info) {
            return res.status(404).json({ message: 'eBay info not found' });
        }
        res.json({
            accountId: info.account_id,
            storeName: info.store_name,
            feedbackScore: info.feedback_score,
            positiveFeedbackPercent: info.positive_feedback_percent,
            sellingLimits: info.selling_limits,
            lastSync: info.last_sync
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching eBay info' });
    }
};

exports.getPerformance = async (req, res) => {
    try {
    const info = await EbayInfo.findOne({ order: [['last_sync', 'DESC']] });
        if (!info) {
            return res.status(404).json({ message: 'eBay info not found' });
        }
        res.json({
            sellerLevel: info.seller_level,
            defectRate: info.defect_rate,
            lateShipmentRate: info.late_shipment_rate,
            transactionDefectRate: info.transaction_defect_rate,
            policyComplianceStatus: info.policy_compliance_status,
            lastSync: info.last_sync
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching eBay performance' });
    }
};

exports.getApiStatus = async (req, res) => {
    try {
    const info = await EbayInfo.findOne({ order: [['last_sync', 'DESC']] });
        if (!info) {
            return res.status(404).json({ message: 'eBay info not found' });
        }
        res.json({
            apiStatus: info.api_status,
            lastSync: info.last_sync
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
        // Map camelCase query param to DB field name
        if (storeName) { where.store_name = { [Op.iLike]: `%${storeName}%` }; }
        if (minFeedbackScore || maxFeedbackScore) { where.feedback_score = {}; }
        if (minFeedbackScore) { where.feedback_score[Op.gte] = parseInt(minFeedbackScore, 10); }
        if (maxFeedbackScore) { where.feedback_score[Op.lte] = parseInt(maxFeedbackScore, 10); }
        const infos = await EbayInfo.findAll({ where });
        // Map DB fields to camelCase in response
        const mapped = infos.map(info => ({
            accountId: info.account_id,
            storeName: info.store_name,
            feedbackScore: info.feedback_score,
            positiveFeedbackPercent: info.positive_feedback_percent,
            sellerLevel: info.seller_level,
            defectRate: info.defect_rate,
            lateShipmentRate: info.late_shipment_rate,
            transactionDefectRate: info.transaction_defect_rate,
            policyComplianceStatus: info.policy_compliance_status,
            sellingLimits: info.selling_limits,
            apiStatus: info.api_status,
            lastSync: info.last_sync
        }));
        res.json(mapped);
    } catch (error) {
        res.status(500).json({ message: 'Error searching eBay info' });
    }
};
