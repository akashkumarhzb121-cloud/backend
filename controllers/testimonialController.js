const Testimonial = require('../models/Testimonial');

// @desc    Create new testimonial (PUBLIC - sets as pending)
exports.createTestimonial = async (req, res) => {
    try {
        const { name, profession, review, rating } = req.body;
        const testimonial = await Testimonial.create({
            name, profession, review, rating, status: 'pending'
        });
        res.status(201).json({ success: true, data: testimonial, message: "Review submitted successfully and is awaiting approval." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all APPROVED testimonials (PUBLIC)
exports.getApprovedTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ status: 'approved' }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: testimonials });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get ALL testimonials (ADMIN)
exports.getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: testimonials });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Testimonial Status (ADMIN)
exports.updateTestimonialStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const testimonial = await Testimonial.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );
        res.status(200).json({ success: true, data: testimonial, message: `Testimonial marked as ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete Testimonial (ADMIN)
exports.deleteTestimonial = async (req, res) => {
    try {
        await Testimonial.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Testimonial deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
