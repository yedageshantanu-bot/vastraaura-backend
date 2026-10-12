const Enquiry = require("../models/Enquiry");

exports.createEnquiry = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Name, email, and message are required" });
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ success: false, error: "Please provide a valid email address" });
    }

    const enquiry = await Enquiry.create({
      name: String(name).trim().slice(0, 100),
      email: String(email).trim().toLowerCase().slice(0, 120),
      phone: phone ? String(phone).trim().slice(0, 20) : "",
      message: String(message).trim().slice(0, 2000),
      user: req.userId || null,
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
    let { status } = req.body;

    const statusMap = {
      new: "New",
      read: "Read",
      replied: "Replied",
      resolved: "Closed",
      closed: "Closed",
    };
    const normalized = statusMap[String(status || "").trim().toLowerCase()] || status;

    if (!["New", "Read", "Replied", "Resolved", "Closed"].includes(normalized)) {
      return res.status(400).json({ success: false, error: "Invalid status. Allowed: New, Replied, Closed" });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      { status: normalized },
      { returnDocument: "after", runValidators: true }
    ).populate("user", "name email phone avatar joinedAt role");

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
