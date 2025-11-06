const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const webPush = require('web-push');

const app = express();
const port = 3000;

const vapidKeys = webPush.generateVAPIDKeys();
console.log('Public VAPID Key:', vapidKeys.publicKey);

webPush.setVapidDetails(
    'mailto:simpor-owner@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

app.use(cors());
app.use(bodyParser.json());

let products = [
    { id: 1, name: "Samsung Galaxy S23", price: 85000, category: "Electronics", image: "./samsung.jpg", stock: 15, reviews: [] },
    { id: 3, name: "Smart Watch Series 8", price: 35000, category: "Electronics", image: "./Apple-Watch-Series-8-a.jpg", stock: 0, reviews: [] },
    { id: 4, name: "Gaming Laptop Pro", price: 98000, category: "Electronics", image: "./gaming-laptops.jpg", stock: 2, reviews: [] },
    { id: 10, name: "Formal Blazer Black", price: 1800, category: "Clothes", image: "images/blazer.jpg", stock: 1, reviews: [] },
    { id: 12, name: "Modern 3-Seater Sofa", price: 145000, category: "Furniture", image: "images/sofa.jpg", stock: 5, reviews: [] },
    { id: 17, name: "Blender Pro 1000W", price: 5900, category: "Kitchen Equipment", image: "images/blender.jpg", stock: 9, reviews: [] }
];

let userCart = [];
let orders = [];
let pushSubscription = null;

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.post('/api/cart/add', (req, res) => {
    const { productId } = req.body;
    const product = products.find(p => p.id === productId);

    if (!product || product.stock <= 0) {
        return res.status(400).json({ message: 'Product out of stock.' });
    }

    product.stock--;
    userCart.push({ id: productId, name: product.name, price: product.price });

    res.json({ message: 'Item added to cart.', cart: userCart });
});

app.post('/api/cart/remove/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const index = userCart.findIndex(item => item.id === productId);

    if (index === -1) {
        return res.status(404).json({ message: 'Item not found in cart.' });
    }

    const removedItem = userCart.splice(index, 1)[0];
    const product = products.find(p => p.id === productId);
    if (product) product.stock++;

    res.json({ message: 'Item removed.', productName: removedItem.name, cart: userCart });
});

app.get('/api/cart/items', (req, res) => {
    res.json(userCart);
});

app.post('/api/order/checkout', (req, res) => {
    if (userCart.length === 0) {
        return res.status(400).json({ message: 'Cart is empty.' });
    }

    const total = userCart.reduce((sum, item) => sum + item.price, 0);
    const newOrder = {
        orderId: Math.floor(Math.random() * 100000) + 1,
        items: userCart,
        totalPrice: total,
        status: 'Processing (Awaiting Payment)',
        userId: 'mock_user_123'
    };

    orders.push(newOrder);
    userCart = [];

    res.json({ message: 'Order created successfully.', order: newOrder });
});

app.post('/api/subscribe', (req, res) => {
    pushSubscription = req.body;
    console.log('Subscription received:', pushSubscription);
    res.status(201).json({ message: 'Subscription saved.' });
});

app.post('/api/admin/confirm-payment/:orderId', async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const order = orders.find(o => o.orderId === orderId);

    if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
    }

    order.status = 'Paid and Confirmed';
    console.log(`Order ${orderId} updated to: ${order.status}`);

    if (pushSubscription) {
        const payload = JSON.stringify({
            title: `✅ Order #${orderId} Confirmed!`,
            body: `Your payment for Ksh ${order.totalPrice.toLocaleString()} has been received. Your order is now being prepared for shipment.`
        });

        try {
            await webPush.sendNotification(pushSubscription, payload);
            console.log('Push notification sent successfully.');
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }

    res.json({ message: 'Payment confirmed and notification attempted.', order: order });
});

app.listen(port, () => {
    console.log(`Mock E-commerce API running at http://localhost:${port}`);
    console.log('To trigger a payment confirmation, navigate to:');
    console.log(`http://localhost:${port}/api/admin/confirm-payment/12345 (Change ID after checkout)`);
    console.log('Make sure to update the VAPID_PUBLIC_KEY in your index.html!');
});