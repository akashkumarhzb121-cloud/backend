const express = require('express');
const router = express.Router();
const { 
    createTestimonial, 
    getApprovedTestimonials, 
    getAllTestimonials, 
    updateTestimonialStatus, 
    deleteTestimonial 
} = require('../controllers/testimonialController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/', createTestimonial); // Users can submit
router.get('/approved', getApprovedTestimonials); // Users see only approved

// Admin routes
router.get('/', protect, admin, getAllTestimonials); // Admin sees all
router.put('/:id/status', protect, admin, updateTestimonialStatus); // Admin accepts/rejects
router.delete('/:id', protect, admin, deleteTestimonial); // Admin deletes

module.exports = router;
