const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/checkout', upload.single('uploadImage'), async (req, res) => {
  // Destructure shippingMethod and pudoLocation here as well:
  let { specialInstructions, orderSummary, cart, email, shippingMethod, pudoLocation } = req.body;
  const uploadImage = req.file;

  // Parse cart if it's a JSON string
  if (typeof cart === 'string') {
    try {
      cart = JSON.parse(cart);
    } catch (e) {
      console.error('Invalid cart JSON', e);
      return res.status(400).send('Invalid cart data.');
    }
  }

  console.log("Special Instructions:", specialInstructions);
  console.log("Order Summary:", orderSummary);
  console.log("Cart:", cart);
  console.log("Email:", email);
  console.log("Shipping Method:", shippingMethod);
  console.log("PUDO Location:", pudoLocation);
  console.log("Uploaded File Info:", uploadImage);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'sebogodiphenyo7@gmail.com',
      pass: 'psvoigzfowftnaxj',
    },
  });

  // Format cart details nicely
  let cartDetails = Array.isArray(cart)
    ? cart.map(item => `${item.name} - R${item.price.toLocaleString()}`).join('\n')
    : String(cart);

  let shippingInfoText = `Shipping Method: ${shippingMethod || 'Not specified'}`;
  if (shippingMethod === 'pudo') {
    shippingInfoText += `\nPUDO Location: ${pudoLocation || 'Not specified'}`;
  }

  // Email to business (owner)
  const ownerMailOptions = {
    from: '"Moeti Collections" <sebogodiphenyo7@gmail.com>',
    to: 'sebogodiphenyo7@gmail.com',
    subject: 'New Order Received - Moeti Collections',
    text: `New order received!\n\nOrder Summary:\n${orderSummary}\n\n${shippingInfoText}\n\nInstructions: ${specialInstructions || "None"}\n\nCart:\n${cartDetails}\n\nCustomer email: ${email}`,
    attachments: uploadImage
      ? [{
          filename: uploadImage.originalname,
          path: uploadImage.path,
        }]
      : [],
  };

  // Email to customer
  const customerMailOptions = {
    from: '"Moeti Collections" <sebogodiphenyo7@gmail.com>',
    to: email,
    subject: 'Your Order Confirmation - Moeti Collections',
    text: `Thank you for your order!\n\nOrder Summary:\n${orderSummary}\n\n${shippingInfoText}\n\nYour cart:\n${cartDetails}\n\nIf you have any questions, reply to this email.`,
    attachments: uploadImage
      ? [{
          filename: uploadImage.originalname,
          path: uploadImage.path,
        }]
      : [],
  };

  try {
    // Send email to business owner
    await transporter.sendMail(ownerMailOptions);
    // Send email to customer
    await transporter.sendMail(customerMailOptions);

    // Delete file after sending (if any)
    if (uploadImage) {
      fs.unlink(uploadImage.path, (err) => {
        if (err) console.error("Failed to delete uploaded file:", err);
      });
    }

    res.send('Order placed. Emails sent!');
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).send('Failed to send email.');
  }
});

app.post('/send-order', upload.single('paymentProof'), async (req, res) => {
  // You can add logic here if you use this endpoint
});

app.get('/', (req, res) => {
  res.send('Moeti Collections backend is running.');
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000/");
});
