const axios = require('axios');

const sendReport = async (req, res) => {
    let data = {
        service_id: 'service_oe8salj',
        template_id: 'PSATemplate',
        user_id: 'user_FBAGBbzqImK25vE4FKYBD',
        template_params: { 'from_name': req.body.fromName, 'message_html': req.body.messageHtml, 'user_agent': req.body.userAgent },
        accessToken: 'f41e347bd28bd50cab3e6fe39aaa9b11'
    };

    axios.post('https://api.emailjs.com/api/v1.0/email/send', data)
        .then(resp => {
            res.send("success");
        }).catch(err => {
            res.send(err);
        });
};

module.exports = {sendReport};