require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const mongoURI = process.env.MONGODB_URI;
// MongoDB Atlas Connection
mongoose.connect(mongoURI)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));
  

// Schemas
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: { type: Date, default: Date.now }
});

const feedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    inquiryType: { 
        type: String, 
        required: true,
        enum: ['order', 'returns', 'products', 'business', 'other']
    },
    message: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const cartItemSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productImage: { type: String, required: true },
    productTitle: { type: String, required: true },
    productPrice: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    addedAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productImage: String,
        productTitle: String,
        productPrice: String,
        quantity: Number
    }],
    totalAmount: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    contactNumber: { type: String, required: true },
    orderDate: { type: Date, default: Date.now },
    status: { type: String, default: 'Processing' }
});

// Models
const User = mongoose.model('User', userSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);
const Contact = mongoose.model('Contact', contactSchema);
const CartItem = mongoose.model('CartItem', cartItemSchema);
const Order = mongoose.model('Order', orderSchema);

// Email transporter setup (for OTP and password reset)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes

// Home route
app.get('/', (req, res) => {
    res.render('index');
});

// Authentication Routes

// Register GET
app.get('/register', (req, res) => {
    res.render('register', { 
        error: null,
    });
});

// Register POST
// Replace the existing register POST route with this:

app.post('/register', async (req, res) => {
    try {
        console.log('Received registration data:', req.body);

        const { fullName, phone, address, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Return just the error message instead of rendering the page
            return res.status(400).send('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName,
            phone,
            address,
            email,
            password: hashedPassword
        });

        await newUser.save();
        console.log('User successfully saved:', newUser);

        req.session.user = {
            id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            phone: newUser.phone,
            address: newUser.address
        };

        // Send success response
        res.status(200).send('Registration successful');
    } catch (error) {
        console.error('Registration Error:', error);
        // Return just the error message
        res.status(500).send('Registration failed. Please try again.');
    }
});

// Login GET
app.get('/login', (req, res) => {
    res.render('login');
});

// Login POST
// Replace the existing login POST route with this:

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found',
                title: 'Login Failed'
            });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials',
                title: 'Login Failed'
            });
        }
        
        // Create session
        req.session.user = {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            address: user.address
        };
        
        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            title: 'Success',
            redirectUrl: '/main_page'
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during login',
            title: 'Error'
        });
    }
});
// ... (previous code remains the same until the forgot password routes)

// Forgot Password GET
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

// Forgot Password POST (updated)
app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Generate OTP
        const otp = crypto.randomInt(1000, 9999).toString();
        
        // Set reset token and expiry (10 minutes)
        user.resetPasswordToken = otp;
        user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
        
        await user.save();
        
        // Send email with OTP
        const mailOptions = {
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
            html: `<p>Your OTP for password reset is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
        };
        
        await transporter.sendMail(mailOptions);
        
        res.json({
            success: true,
            message: 'OTP sent to your email'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error processing forgot password request'
        });
    }
});

// Verify OTP POST (updated)
app.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        // Find user
        const user = await User.findOne({ 
            email, 
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password and clear reset token
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
});

// ... (rest of the server.js code remains the same)

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Main Page (protected route)
app.get('/main_page', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
    try {
        res.render('main_page', { 
            fullName: req.session.user.fullName,
            phone: req.session.user.phone,
            email: req.session.user.email,
            address: req.session.user.address
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading main page');
    }
});
//offers_page route
app.get('/offers_page', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('offers_page');
});

//buy page route 
app.get('/buy_page',(req,res)=>{
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        res.render('buy_page', { 
            fullName: req.session.user.fullName,
            phone: req.session.user.phone,
            email: req.session.user.email,
            address: req.session.user.address
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading buy page');
    }
});
//five-sections routes

//electronics_page route
app.get('/electronics_page',(req,res)=>{
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        res.render('electronics_page');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading electronics_page ');
    }
})
//fashion_page route
app.get('/fashion_page',(req,res)=>{
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        res.render('fashion_page');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading fashion_page');
    }
})
//groceries_page route
app.get('/groceries_page',(req,res)=>{
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        res.render('groceries_page');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading groceries_page ');
    }
})
//health_beauty_page route
app.get('/health_beauty_page',(req,res)=>{
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        res.render('health_beauty_page');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading health_beauty_page');
    }
})
//kids_page route
app.get('/kids_page',(req,res)=>{
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        res.render('kids_page');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading kids_page');
    }
})
// Feedback Routes

// Add these routes after your existing routes

// Submit Feedback POST
// Update the submit-feedback route with better error handling
app.post('/submit-feedback', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Please login first',
            title: 'Authentication Required',
            icon: 'warning'
        });
    }

    try {
        const { rating, description } = req.body;

        // Validate input
        if (!rating || !description) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both rating and description',
                title: 'Missing Information',
                icon: 'warning'
            });
        }

        // Create new feedback
        const feedback = new Feedback({
            userId: req.session.user.id,
            rating: parseInt(rating),
            description: description.trim()
        });

        await feedback.save().then((res) => {  
            console.log('Feedback saved:', res);
        }
        ).catch((err) => { 
            console.error('Error saving feedback:', err);
        }
        );

        // Send success response with popup data
        res.json({
            success: true,
            title: 'Thank You!',
            message: 'Your feedback has been submitted successfully',
            icon: 'success',
            showConfetti: true // Optional flag for extra effects
        });

    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({
            success: false,
            title: 'Error',
            message: 'Failed to submit feedback. Please try again.',
            icon: 'error'
        });
    }
});

// Show Feedbacks GET
// Update the show-feedbacks route:

app.get('/show-feedbacks', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
    try {
        // Fetch all feedbacks with populated user information
        const feedbacks = await Feedback.find()
            .populate('userId', 'fullName')
            .sort({ createdAt: -1 });

        res.render('show_feedbacks', {
            user: {
                id: req.session.user.id,
                _id: req.session.user.id // Add this for compatibility
            },
            feedbacks: feedbacks
        });
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).send('Error loading feedbacks');
    }
});
// Update Feedback PUT
// Update Feedback route
app.post('/update-feedback/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Please login first',
            title: 'Authentication Required'
        });
    }

    try {
        const { rating, description } = req.body;
        
        const feedback = await Feedback.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.user.id },
            { 
                rating: parseInt(rating), 
                description: description.trim() 
            },
            { new: true }
        ).populate('userId', 'fullName');

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found or unauthorized',
                title: 'Error'
            });
        }

        // Get updated stats
        const allFeedbacks = await Feedback.find();
        const stats = {
            total: allFeedbacks.length,
            average: (allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length).toFixed(1),
            positive: allFeedbacks.filter(f => f.rating >= 4).length
        };

        res.json({
            success: true,
            message: 'Feedback updated successfully',
            feedback,
            stats
        });
    } catch (error) {
        console.error('Feedback update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating feedback',
            title: 'Error'
        });
    }
});

// Delete Feedback route
app.post('/delete-feedback/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Please login first',
            title: 'Authentication Required'
        });
    }

    try {
        const feedback = await Feedback.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.user.id
        });

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found or unauthorized',
                title: 'Error'
            });
        }

        // Get updated stats
        const remainingFeedbacks = await Feedback.find();
        const stats = remainingFeedbacks.length > 0 ? {
            total: remainingFeedbacks.length,
            average: (remainingFeedbacks.reduce((sum, f) => sum + f.rating, 0) / remainingFeedbacks.length).toFixed(1),
            positive: remainingFeedbacks.filter(f => f.rating >= 4).length
        } : null;

        res.json({
            success: true,
            message: 'Feedback deleted successfully',
            isLastFeedback: remainingFeedbacks.length === 0,
            stats
        });
    } catch (error) {
        console.error('Feedback deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting feedback',
            title: 'Error'
        });
    }
});

// Contact Form Routes

// Contact Form Submission
app.post('/submit-contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Input validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
 // Create new contact entry
 const newContact = new Contact({
    name,
    email,
    inquiryType: subject,
    message,
    createdAt: new Date()
});

await newContact.save();

// Send confirmation email
const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Contact Form Submission Received',
    html: `
        <h2>Thank you for contacting us!</h2>
        <p>Dear ${name},</p>
        <p>We have received your message regarding: ${subject}</p>
        <p>We will get back to you within 24 hours.</p>
        <br>
        <p>Best regards,</p>
        <p>Friends Cart Team</p>
    `
};
await transporter.sendMail(mailOptions);

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Thank you! We will respond within 24 hours.'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request.'
        });
    }
});


// Product and Cart Routes

// Add to Cart POST
// Update the add-to-cart route in server.js
// Check server.js route
app.post('/add-to-cart', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to add items to cart'
            });
        }

        const { productImage, productTitle, productPrice, quantity } = req.body;

        // Create new cart item
        const cartItem = new CartItem({
            userId: req.session.user.id,
            productImage,
            productTitle,
            productPrice,
            quantity: quantity || 1
        });

        await cartItem.save();

        res.status(200).json({
            success: true,
            message: 'Added to cart successfully'
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding to cart'
        });
    }
});

// Cart Page GET (NEW PAGE YOU REQUESTED)
// Enhanced Cart Routes

// Get Cart Items (with additional user details)
app.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
    try {
        // Get user details
        const user = await User.findById(req.session.user.id);
        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        // Get cart items
        const cartItems = await CartItem.find({ userId: req.session.user.id }).sort({ addedAt: -1 });
        
        // Calculate total
        let total = 0;
        cartItems.forEach(item => {
            const price = parseFloat(item.productPrice.replace(/[^0-9.-]+/g, ""));
            total += price * item.quantity;
        });
        
        res.render('cart', {
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                address: user.address
            },
            cartItems,
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error('Cart Error:', error);
        res.status(500).render('error', { 
            message: 'Error loading your cart',
            error: error.message
        });
    }
});

// Update Cart Item Quantity (with validation)
// Update your cart item update route:

app.post('/update-cart-item/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Please login first'
        });
    }

    try {
        const quantity = parseInt(req.body.quantity);
        const item = await CartItem.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.user.id },
            { quantity: quantity },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Calculate new total for all items
        const cartItems = await CartItem.find({ userId: req.session.user.id });
        let total = 0;
        cartItems.forEach(cartItem => {
            const price = parseFloat(cartItem.productPrice.replace(/[^0-9.-]+/g, ""));
            total += price * cartItem.quantity;
        });

        // Calculate item total
        const itemPrice = parseFloat(item.productPrice.replace(/[^0-9.-]+/g, ""));
        const itemTotal = itemPrice * quantity;

        res.json({
            success: true,
            message: 'Quantity updated',
            itemTotal: itemTotal,
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error('Update quantity error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating quantity'
        });
    }
});

// Remove Cart Item (with enhanced response)
app.post('/remove-cart-item/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Please login first' 
        });
    }

    try {
        const item = await CartItem.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.user.id
        });
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }
        
        // Calculate new total and remaining items
        const cartItems = await CartItem.find({ userId: req.session.user.id });
        let total = 0;
        cartItems.forEach(cartItem => {
            const price = parseFloat(cartItem.productPrice.replace(/[^0-9.-]+/g, ""));
            total += price * cartItem.quantity;
        });

        res.json({
            success: true,
            message: 'Item removed from cart',
            total: total.toFixed(2),
            isCartEmpty: cartItems.length === 0,
            cartItems // Send back the updated cart items
        });
    } catch (error) {
        console.error('Remove Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart'
        });
    }
});

// Clear Cart (new route)
app.post('/clear-cart', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Please login first' 
        });
    }

    try {
        await CartItem.deleteMany({ userId: req.session.user.id });
        
        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Clear Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart'
        });
    }
});
// Add this new route for buying single items
// In your server.js, update the buy-single-item route
app.post('/buy-single-item/:id', async (req, res) => {
    try {
        const cartItem = await CartItem.findById(req.params.id);
        if (!cartItem) return res.status(404).json({ error: 'Item not found' });

        // Create order
        const order = new Order({
            userId: req.session.user.id,
            items: [{
                productImage: cartItem.productImage,
                productTitle: cartItem.productTitle,
                productPrice: cartItem.productPrice,
                quantity: cartItem.quantity
            }],
            totalAmount: cartItem.productPrice,
            shippingAddress: req.session.user.address,
            contactNumber: req.session.user.phone
        });

        await order.save();
        await CartItem.findByIdAndDelete(req.params.id);

        res.json({ success: true, orderId: order._id });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Route to get cart data for AJAX requests
app.get('/cart-data', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }

    try {
        const cartItems = await CartItem.find({ userId: req.session.user.id }).sort({ addedAt: -1 });
        
        // Calculate total
        let total = 0;
        cartItems.forEach(item => {
            const price = parseFloat(item.productPrice.replace(/[^0-9.-]+/g, ""));
            total += price * item.quantity;
        });

        res.json({
            success: true,
            cartItems,
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error('Cart Data Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart data'
        });
    }
});

// Checkout POST
app.post('/checkout', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }
    
    try {
        // Get cart items
        const cartItems = await CartItem.find({ userId: req.session.user.id });
        
        if (cartItems.length === 0) {
            return res.status(400).send('Cart is empty');
        }
        
        // Calculate total
        let total = 0;
        const itemsForOrder = cartItems.map(item => {
            const price = parseFloat(item.productPrice.replace(/[^0-9.-]+/g, ""));
            total += price * item.quantity;
            
            return {
                productImage: item.productImage,
                productTitle: item.productTitle,
                productPrice: item.productPrice,
                quantity: item.quantity
            };
        });
        
        // Create order
        const newOrder = new Order({
            userId: req.session.user.id,
            items: itemsForOrder,
            totalAmount: `₹${total.toFixed(2)}`,
            shippingAddress: req.session.user.address,
            contactNumber: req.session.user.phone
        });
        
        await newOrder.save();
        
        // Clear cart
        await CartItem.deleteMany({ userId: req.session.user.id });
        
        // Redirect to order confirmation (you can create this page)
        res.redirect(`/order-confirmation/${newOrder._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing checkout');
    }
});

// Order Confirmation GET
app.get('/order-confirmation/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            userId: req.session.user.id
        });
        
        if (!order) {
            return res.status(404).send('Order not found');
        }
        
        res.render('order_confirmation', {
            user: req.session.user,
            order
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading order confirmation');
    }
});
// Update profile route
app.post('/update-profile', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }

    try {
        const { fullName, email, phone, address } = req.body;

        // Validate input
        if (!fullName || !email || !phone || !address) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.session.user.id,
            { fullName, email, phone, address },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Update session
        req.session.user = {
            id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            phone: updatedUser.phone,
            address: updatedUser.address
        };

        res.json({ 
            success: true, 
            message: 'Profile updated successfully' 
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating profile' 
        });
    }
});

// Buy Now (direct purchase without cart)
app.post('/buy-now', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }
    
    try {
        const { productImage, productTitle, productPrice, quantity } = req.body;
        
        // Create order directly
        const price = parseFloat(productPrice.replace(/[^0-9.-]+/g, ""));
        const total = price * (quantity || 1);
        
        const newOrder = new Order({
            userId: req.session.user.id,
            items: [{
                productImage,
                productTitle,
                productPrice,
                quantity: quantity || 1
            }],
            totalAmount: `₹${total.toFixed(2)}`,
            shippingAddress: req.session.user.address,
            contactNumber: req.session.user.phone
        });
        
        await newOrder.save();
        
        res.redirect(`/order-confirmation/${newOrder._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing purchase');
    }
});
// 404 Route (Keep this as the last route)
app.use((req, res) => {
    res.status(404).render('404');
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
