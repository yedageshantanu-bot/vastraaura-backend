const Enquiry = require("../models/Enquiry");

exports.createEnquiry = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;

    const enquiry = await Enquiry.create({
      name,
      email,
      phone,
      message,
      user: req.userId, // Assumes `protect` middleware runs first and sets req.userId
    });

    res.status(201).json({
      success: true,
      enquiry,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEnquiries = async (req, res, next) => {
  try {
    // Requires admin
    const enquiries = await Enquiry.find().populate("user", "name email phone avatar joinedAt role").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: enquiries.length,
      enquiries,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["New", "Read", "Resolved"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(id, { status }, { new: true, runValidators: true }).populate("user", "name email phone avatar joinedAt role");

    if (!enquiry) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }

    res.status(200).json({
      success: true,
      enquiry,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findByIdAndDelete(id);

    if (!enquiry) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
