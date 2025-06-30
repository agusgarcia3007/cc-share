# CC-Share

##### Share Credit Card Details Securely

cc-share is a secure tool to share credit card information with end-to-end encryption. It uses **AES-GCM** encryption to protect your sensitive data before sending it to the server. The encryption key never leaves your browser.

## 🔒 Features

- **End-to-End Encryption:** AES-GCM encryption protects your credit card data before it reaches the server
- **Shareable Links:** Generate secure links to share credit card information temporarily
- **Configurable Expiration:** Set custom TTL (time to live) for automatic data deletion
- **Read Limits:** Control how many times the shared data can be accessed
- **Zero-Knowledge Server:** The server never sees your unencrypted credit card information
- **React Hook Form:** Type-safe form validation with Zod schemas

## 🛡️ Security Model

### Client-Side Encryption

1. Credit card data is encrypted in your browser using AES-GCM
2. A random encryption key is generated for each share
3. Only the encrypted data is sent to the server
4. The encryption key is embedded in the share URL fragment (never sent to server)

### Server-Side Protection

- Server only stores encrypted blobs
- No access to encryption keys or plaintext data
- Automatic data deletion based on TTL and read limits
- Redis storage with configurable expiration

## 🚀 Built with

- **Next.js 15** with App Router
- **React Hook Form** + **Zod** for form validation
- **Tailwind CSS** + **shadcn/ui** for styling
- **Upstash Redis** for encrypted data storage
- **TypeScript** for type safety

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Upstash Redis Configuration
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token
```

## 📖 How It Works

### 1. Sharing Credit Card Data

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   Server        │    │     Redis       │
│                 │    │                 │    │                 │
│ 1. Fill form    │    │                 │    │                 │
│ 2. Generate key │    │                 │    │                 │
│ 3. Encrypt data │───▶│ 4. Store blob   │───▶│ 5. Save with    │
│ 4. Create link  │    │ 5. Return ID    │    │    TTL/reads    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. Retrieving Credit Card Data

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   Server        │    │     Redis       │
│                 │    │                 │    │                 │
│ 1. Visit link   │    │                 │    │                 │
│ 2. Extract key  │    │                 │    │                 │
│ 3. Request data │───▶│ 4. Fetch blob   │───▶│ 5. Decrement    │
│ 4. Decrypt data │◀───│ 5. Return blob  │    │    reads        │
│ 5. Display card │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Usage

### Sharing Credit Card Information

1. **Fill the form** with credit card details
2. **Configure settings:**
   - **Reads:** Number of times the data can be accessed (1, 3, 5, 10, or unlimited)
   - **TTL:** Time before automatic deletion (1 hour, 1 day, 7 days, 30 days)
3. **Click "Encrypt and Share"** to generate a secure link
4. **Share the link** with the intended recipient

### Accessing Shared Data

1. **Click the shared link** to view the encrypted data
2. **Data is automatically decrypted** in your browser
3. **View credit card details** in a secure, formatted display
4. **Data may expire** after the configured reads/time limit

## ⚠️ Security Considerations

### ✅ What's Protected

- Credit card data is encrypted before leaving your browser
- Server never has access to encryption keys
- Automatic data deletion prevents long-term exposure
- Read limits prevent unlimited access
- HTTPS encryption for all communications

### ⚠️ Important Notes

- **Share links responsibly** - anyone with the link can decrypt the data
- **Links expire** based on your configuration
- **Use secure channels** to share links (encrypted messaging, etc.)
- **Not for permanent storage** - this is for temporary sharing only

## 🚧 Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Upstash Redis account

### Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd cc-share
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
# Add your Upstash Redis credentials
```

4. **Run development server**

```bash
pnpm dev
```

5. **Open in browser**

```
http://localhost:3000
```

## 📡 API Reference

### Store Encrypted Data

```bash
POST /api/v1/share
Content-Type: application/json

{
  "encrypted": "base64-encoded-encrypted-data",
  "reads": 3,
  "ttl": 3600
}
```

**Response:**

```json
{
  "id": "unique-share-id",
  "url": "https://cc-share.app/share/unique-share-id#encryption-key",
  "expiresAt": "2024-01-20T15:30:00Z",
  "remainingReads": 3
}
```

### Retrieve Encrypted Data

```bash
GET /api/v1/share/[id]
```

**Response:**

```json
{
  "encrypted": "base64-encoded-encrypted-data",
  "remainingReads": 2
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [envshare](https://github.com/chronark/envshare) by [@chronark](https://github.com/chronark)
- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Powered by [Upstash Redis](https://upstash.com/) for serverless storage

---

**⚠️ Disclaimer:** This tool is designed for temporary, secure sharing of credit card information. Always follow your organization's security policies and compliance requirements when handling sensitive financial data.
