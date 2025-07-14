const { stateOptions } = require("../config/data");

// Get all airlines without pagination, sorting, and search
const getAllStates = async (req, res, next) => {
  try {
    res.status(200).json(stateOptions);
  } catch (error) {
    return res.status(500).json({
      errors: {
        message: "Failed to fetch states",
        details: error.message,
      },
    });
  }
};

// Get a purchase by ID
const getMemberState = async (req, res) => {
  try {
    res.status(200).json({ State: req.user.member.memberState });
  } catch (error) {
    res.status(500).json({
      errors: {
        message: "Failed to fetch Member State",
        details: error.message,
      },
    });
  }
};

module.exports = {
  getAllStates,
  getMemberState,
};
