const axios = require('axios');
const config = require('./config');

class MpesaAPI {
	constructor() {
		this.baseURL = config.MPESA_ENV === 'sandbox' 
			? 'https://sandbox.safaricom.co.ke' 
			: 'https://api.safaricom.co.ke';
	}

	async getAccessToken() {
		const auth = Buffer.from(`${config.MPESA_CONSUMER_KEY}:${config.MPESA_CONSUMER_SECRET}`).toString('base64');
		try {
			const response = await axios.get(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
				headers: {
					Authorization: `Basic ${auth}`
				}
			});
			return response.data.access_token;
		} catch (error) {
			throw new Error('Failed to get access token');
		}
	}

	async initiateSTKPush(phoneNumber, amount, accountReference) {
		const accessToken = await this.getAccessToken();
		const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
		const password = Buffer.from(
			`${config.MPESA_SHORTCODE}${config.MPESA_PASSKEY}${timestamp}`
		).toString('base64');

		try {
			const response = await axios.post(
				`${this.baseURL}/mpesa/stkpush/v1/processrequest`,
				{
					BusinessShortCode: config.MPESA_SHORTCODE,
					Password: password,
					Timestamp: timestamp,
					TransactionType: 'CustomerPayBillOnline',
					Amount: amount,
					PartyA: phoneNumber,
					PartyB: config.MPESA_SHORTCODE,
					PhoneNumber: phoneNumber,
					CallBackURL: config.CALLBACK_URL,
					AccountReference: accountReference,
					TransactionDesc: 'WiFi Access Payment'
				},
				{
					headers: {
						Authorization: `Bearer ${accessToken}`
					}
				}
			);
			return response.data;
		} catch (error) {
			throw new Error('STK push failed');
		}
	}

	async checkTransactionStatus(checkoutRequestID) {
		const accessToken = await this.getAccessToken();
		const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
		const password = Buffer.from(
			`${config.MPESA_SHORTCODE}${config.MPESA_PASSKEY}${timestamp}`
		).toString('base64');

		try {
			const response = await axios.post(
				`${this.baseURL}/mpesa/stkpushquery/v1/query`,
				{
					BusinessShortCode: config.MPESA_SHORTCODE,
					Password: password,
					Timestamp: timestamp,
					CheckoutRequestID: checkoutRequestID
				},
				{
					headers: {
						Authorization: `Bearer ${accessToken}`
					}
				}
			);
			return response.data;
		} catch (error) {
			throw new Error('Transaction status check failed');
		}
	}
}

module.exports = new MpesaAPI();