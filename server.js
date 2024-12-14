const express = require('express');
const bodyParser = require('body-parser');
const exec = require('child_process').exec;
const mpesa = require('./mpesa');
const app = express();
const port = 3000;

// Store pending payments
const pendingPayments = new Map();

// Middleware
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files

// Store active sessions
const activeSessions = new Map();

// Middleware to capture client MAC address
app.use((req, res, next) => {
	const clientMAC = req.headers['x-client-mac'] || 
					 req.connection.remoteAddress;
	req.clientMAC = clientMAC;
	next();
});

// Check if client is authenticated
app.get('/check-auth', (req, res) => {
	const isAuthenticated = activeSessions.has(req.clientMAC);
	res.json({ authenticated: isAuthenticated });
});

// Handle payment initiation
app.post('/initiate_payment', async (req, res) => {
	const { mpesaNumber, amount } = req.body;
	const clientMAC = req.clientMAC;

	try {
		// Generate unique reference
		const accountReference = `WIFI_${Date.now()}`;
		
		// Initiate STK Push
		const stkResponse = await mpesa.initiateSTKPush(
			mpesaNumber,
			amount,
			accountReference
		);

		// Store checkout request for later verification
		pendingPayments.set(stkResponse.CheckoutRequestID, {
			clientMAC,
			amount,
			timestamp: Date.now()
		});

		res.json({ 
			success: true, 
			checkoutRequestID: stkResponse.CheckoutRequestID,
			message: 'Please check your phone to complete payment'
		});
	} catch (error) {
		res.json({ success: false, message: error.message });
	}
});

// M-Pesa callback endpoint
app.post('/mpesa-callback', async (req, res) => {
	const { Body } = req.body;
	
	if (Body.stkCallback.ResultCode === 0) {
		const checkoutRequestID = Body.stkCallback.CheckoutRequestID;
		const paymentDetails = pendingPayments.get(checkoutRequestID);
		
		if (paymentDetails) {
			await grantNetworkAccess(paymentDetails.clientMAC);
			activeSessions.set(paymentDetails.clientMAC, {
				startTime: Date.now(),
				package: paymentDetails.amount
			});
			pendingPayments.delete(checkoutRequestID);
		}
	}
	
	res.json({ success: true });
});

// Add payment status check endpoint
app.get('/check-payment-status/:checkoutRequestID', async (req, res) => {
	try {
		const status = await mpesa.checkTransactionStatus(req.params.checkoutRequestID);
		res.json({ success: true, status });
	} catch (error) {
		res.json({ success: false, message: error.message });
	}
});

// Function to grant network access (using iptables)
function grantNetworkAccess(clientMAC) {
	return new Promise((resolve, reject) => {
		const command = `iptables -I FORWARD 1 -t nat -s ${clientMAC} -j ACCEPT`;
		exec(command, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
}

// Start server
app.listen(port, () => {
	console.log(`Captive portal running on port ${port}`);
});