# OnlyArchitects.art

A community platform for architects to connect, share ideas, and build meaningful professional relationships.

## 🌐 Live Site
[https://onlyarchitects.art](https://onlyarchitects.art)

## 🛠️ Tech Stack
- HTML5 / CSS3
- Bootstrap 5.3
- Font Awesome icons
- Google Fonts (Doto)
- Azure Static Web Apps

## 🚀 Deployment
This site is automatically deployed to Azure Static Web Apps when changes are pushed to the `main` branch.

## 📁 Structure
```
├── index.html              # Main HTML page
├── style.css               # Custom styles
├── favicon.png             # Site favicon
├── robots.txt              # Search engine directives
├── staticwebapp.config.json # Azure SWA configuration
└── .github/workflows/      # CI/CD pipeline
```

## 🔒 Security
Security headers are configured in `staticwebapp.config.json`:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection enabled
- Referrer-Policy: strict-origin-when-cross-origin

## 📄 License
See [LICENSE](LICENSE) file.
