const Message = require("../models/message.model");

// Allow simple current-user simulation in Postman without auth middleware
const getCurrentUser = (req) => {
  return (
    req.header("x-user-id") ||
    req.query.user ||
    req.query.currentUser ||
    req.query.from ||
    req.body.from
  );
};

/**
 * GET /api/messages/:userID
 * Query/Header: current user via x-user-id or ?user=
 */
const getMessagesWithUser = async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { userID } = req.params;

    if (!currentUser) {
      return res.status(400).json({
        success: false,
        message: "Current user is required (x-user-id header or ?user=)",
      });
    }

    const messages = await Message.find({
      $or: [
        { from: currentUser, to: userID },
        { from: userID, to: currentUser },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/messages/:userID
 * Body: { messageContent: { type: "file"|"text", text: "..." } }
 */
const sendMessage = async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const { userID } = req.params;
    const { messageContent } = req.body;

    if (!currentUser) {
      return res.status(400).json({
        success: false,
        message: "Current user is required (x-user-id header or ?user=)",
      });
    }

    if (!messageContent || !messageContent.type || !messageContent.text) {
      return res.status(400).json({
        success: false,
        message: "messageContent.type and messageContent.text are required",
      });
    }

    if (!["file", "text"].includes(messageContent.type)) {
      return res
        .status(400)
        .json({ success: false, message: "messageContent.type must be file or text" });
    }

    const message = await Message.create({
      from: currentUser,
      to: userID,
      messageContent: {
        type: messageContent.type,
        text: messageContent.text,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Message sent",
      data: message,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/messages
 * Query/Header: current user via x-user-id or ?user=
 * Return latest message per conversation partner
 */
const getLatestMessages = async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return res.status(400).json({
        success: false,
        message: "Current user is required (x-user-id header or ?user=)",
      });
    }

    const latest = await Message.aggregate([
      {
        $match: {
          $or: [{ from: currentUser }, { to: currentUser }],
        },
      },
      {
        $addFields: {
          chatUser: {
            $cond: [{ $eq: ["$from", currentUser] }, "$to", "$from"],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$chatUser",
          latestMessage: { $first: "$$ROOT" },
        },
      },
      {
        $match: {
          latestMessage: { $ne: null },
        },
      },
      { $replaceRoot: { newRoot: "$latestMessage" } },
      { $sort: { createdAt: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      count: latest.length,
      data: latest,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMessagesWithUser,
  sendMessage,
  getLatestMessages,
};
