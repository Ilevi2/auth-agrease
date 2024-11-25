const axios = require('axios');

const sendEmail = async ({ fromName, fromAddress, toName, toAddress, subject, content }) => {
  try {
    const response = await axios.post(
      'https://fimail.vercel.app/send',
      {
        from: { name: fromName, address: fromAddress },
        to: { name: toName, address: toAddress },
        subject,
        contents: content,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    console.log('Email sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to send email:', error.response ? error.response.data : error.message);
    throw new Error('Email sending failed.');
  }
};

module.exports = sendEmail;
