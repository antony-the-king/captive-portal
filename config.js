// M-Pesa API Configuration
const config = {
	MPESA_CONSUMER_KEY: 'your_consumer_key_here',
	MPESA_CONSUMER_SECRET: 'your_consumer_secret_here',
	MPESA_PASSKEY: 'your_passkey_here',
	MPESA_SHORTCODE: 'your_shortcode_here',
	MPESA_ENV: 'sandbox', // Change to 'production' for live environment
	CALLBACK_URL: 'https://your-domain.com/mpesa-callback'
};

module.exports = config;