module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const botToken = process.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.VITE_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        return res.status(500).json({ ok: false, error: 'Server env is not configured' });
    }

    const { name, email, phone, subject, message } = req.body || {};

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const text = [
        'Нове повідомлення з сайту:',
        `Ім\'я: ${String(name).trim()}`,
        `Email: ${String(email).trim()}`,
        `Телефон: ${String(phone || '').trim() || 'не вказано'}`,
        `Тема: ${String(subject).trim()}`,
        '',
        String(message).trim(),
    ].join('\n');

    try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text,
            }),
        });

        const telegramData = await telegramResponse.json();

        if (!telegramResponse.ok || !telegramData.ok) {
            return res.status(502).json({ ok: false, error: 'Telegram API error', details: telegramData });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        return res.status(500).json({ ok: false, error: 'Unexpected server error' });
    }
};
