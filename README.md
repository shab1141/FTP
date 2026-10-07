# Point-to-Point File Transfer App

A simple, web-based file transfer application that allows two devices to connect and transfer files over local network, WiFi, or internet.

## Features

- **Multiple Connection Modes:**
  - Local Network (LAN) via WebRTC
  - Internet P2P with signaling server
  - Simple UI for easy file transfer

- **File Transfer:**
  - Drag-and-drop interface
  - Real-time progress tracking
  - Support for multiple file types
  - Fast peer-to-peer transfer

## Getting Started

### Local Development

```bash
# Clone the repository
git clone https://github.com/shab1141/FTP.git
cd FTP

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

### Deployment

The web app is configured for GitHub Pages deployment:

```bash
npm install gh-pages --save-dev
npm run build
npm run deploy
```

Your app will be live at: `https://shab1141.github.io/FTP`

## How It Works

1. **Open the app** on two devices on the same network
2. **Device A** creates a connection (generates a code)
3. **Device B** joins using the code
4. Once connected, either device can send files
5. Files transfer directly peer-to-peer

## Architecture

- **Frontend:** React + Vite
- **P2P Protocol:** WebRTC DataChannel
- **Hosting:** GitHub Pages (frontend)
- **Build Tool:** Vite for fast development and optimized production builds

## Technologies Used

- React 18
- WebRTC (for peer-to-peer communication)
- Vite (build tool)
- GitHub Pages (hosting)

## Browser Support

- Chrome/Edge 51+
- Firefox 55+
- Safari 11+
- Opera 38+

All modern browsers with WebRTC support.

## Future Enhancements

- Bluetooth P2P support
- WiFi Direct support
- Drag-and-drop file upload
- Multiple file transfer
- File encryption
- Mobile app versions (React Native/Flutter)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
